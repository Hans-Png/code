/* eslint-disable no-await-in-loop */
import { ValidationError } from "common-errors";
import { Heap } from "heap-js";
import BaseService from "../bases/service.base";
import Database from "../database";
import { AirportEntity, RouteEntity, VisaPolicyEntity } from "../entities";
import type {
  AirportNode,
  FlightRouteParams,
  RouteData,
  RuleSet,
  TravelDocInfo,
  VisaInfo,
} from "../typedef/flightroute";
import { logger as consola } from "../utils";

// Typings //

interface CalculateStepParams {
  index: number;
  from: AirportEntity;
  to: AirportEntity;
  travelDocs: TravelDocInfo[];
  visaInfos: VisaInfo[];
  /** Use the route result map from the parent functions */
  routeResult: Map<number, RouteData[]>;
  /** Cache for airport nodes. */
  airportNodeCache: Map<string, AirportNode>;
  ruleSets?: RuleSet[];
}

interface CalculateNodeParams {
  currentNode: AirportNode;
  destination: AirportEntity;
  travelDocs: TravelDocInfo[];
  visaInfos: VisaInfo[];
  airportNodeCache: Map<string, AirportNode>;
  ruleSet?: RuleSet[];
}

class FlightRouteService extends BaseService {
  static #logger = consola.withTag("FlightRouteService");

  public static async calculateRoute(data: FlightRouteParams) {
    // Database
    const db = Database.getInstance();
    const { em } = db;

    // Extract
    const { from, to, transitThrough, travelDocs, visaInfos } = data;

    // Variable
    const airportItinerary = new Map<number, AirportEntity>(); // Using Map to avoid order issue
    const routeResult = new Map<number, RouteData[]>(); // Using Map to avoid order issue
    const airportNodeCache = new Map<string, AirportNode>(); // Cache during calculation

    // Inidialize itinerary map
    const itinerary = transitThrough ? [from, ...transitThrough, to] : [from, to];
    await Promise.all(itinerary.map(async (iata, index) => {
      const airport = await em.findOneOrFail(AirportEntity, { iata }, { populate: ["country"] });
      airportItinerary.set(index, airport);
    }));

    // Slide context windows to calcuate itinerary between each node
    const destinationsCount = airportItinerary.size;
    const calculateStepPromises: Promise<void>[] = [];
    for (let i = 0; i < destinationsCount - 1; i += 1) {
      // Get airport entity by order
      const fromAirportEntity = airportItinerary.get(i)!;
      const toAirportEntity = airportItinerary.get(i + 1)!;
      // Create calculation promise
      const calculateStepPromise = this.calculateStep({
        index: i,
        from: fromAirportEntity,
        to: toAirportEntity,
        travelDocs,
        visaInfos,
        routeResult,
        airportNodeCache,
      });
      // Push to the array and wait them finish running
      calculateStepPromises.push(calculateStepPromise);
    }
    await Promise.all(calculateStepPromises);

    this.#logger.debug(`Output route result from ${from} to ${to}`, [...routeResult]);

    return routeResult;
  }

  // A* Helpers //

  /**
   * Helper function to create airport node
   */
  private static createAirportNode(
    airport: AirportEntity,
    parent: AirportNode | null,
  ): AirportNode {
    return {
      airport,
      parent,
      routeToParent: null,
      routeToDestination: null,
      nodeToParentCount: 0,
      distanceSoFar: 0,
      gScore: 0,
      hScore: 0,
      fScore: 0,
    };
  }

  /**
   * Async method for creating promise for each step of the calculation during slide through
   * the context window.
   */
  private static async calculateStep(data: CalculateStepParams) {
    // Extract property
    const { index, from, to, travelDocs, visaInfos } = data;

    // If there is direct route, return result
    // Do not need to consider visa data here, but send reminder if there is visa requirement
    const directRoute = await this.getFlightRouteBetween(from, to);
    if (directRoute) {
      const directRouteData: RouteData = {
        from: this.createAirportNode(from, null),
        to: this.createAirportNode(to, null),
        route: directRoute,
      };
      data.routeResult.set(index, [directRouteData]);
    } else {
      // Start searching transit route based on A* algorithm
      const result = await this.search({
        from,
        to,
        travelDocs,
        visaInfos,
        routeResult: data.routeResult,
        airportNodeCache: data.airportNodeCache,
      });

      if (!result || !result.length) {
        this.#logger.error(`No route found between ${from.iata} and ${to.iata}`);
        throw new Error(`No route found between ${from.iata} and ${to.iata}`);
      }
      data.routeResult.set(index, result);
    }
  }

  /**
   * Using A* seacrching algorithm to find the shortest path between two airports.
   */
  private static async search(
    data: Omit<CalculateStepParams, "index">,
  ) {
    // Extract property
    const { from, to, travelDocs, visaInfos, ruleSets } = data;

    // Variable for Set
    /** Priority Queue */
    const openSet = new Heap<AirportNode>((a, b) => {
      if (a.nodeToParentCount !== b.nodeToParentCount) {
        return a.nodeToParentCount - b.nodeToParentCount;
      }
      return a.fScore - b.fScore;
    });
    /** Tracking path, only store the optimal route */
    const cameFrom = new Map<string, AirportNode>();
    /** Store the nodes that have been abandoned. if fScore is Infinity or not optimal one */
    const abandonNodes = new Set<string>();

    // Initialize
    const startNode = this.createAirportNode(from, null);
    data.airportNodeCache.set(startNode.airport.iata, startNode);
    openSet.push(startNode);
    cameFrom.set(from.iata, startNode);

    // Start to search node
    while (!openSet.isEmpty()) {
      const currentNode = openSet.pop()!;
      const currentNodeKey = currentNode.airport.iata;

      // If reach destination
      if (currentNodeKey === to.iata) {
        return this.reconstructPath(cameFrom, currentNode);
      }

      // If it is optimal candidate
      if (currentNode.routeToDestination) {
        const path = this.reconstructPath(cameFrom, currentNode);
        path.push({
          from: currentNode,
          to: this.createAirportNode(to, currentNode),
          route: currentNode.routeToDestination,
        });
        return path;
      }

      // Get Neighbors
      const neighborNodes = await this.getNeighborNodes({
        currentNode,
        destination: to,
        travelDocs,
        visaInfos,
        airportNodeCache: data.airportNodeCache,
        ruleSet: ruleSets,
      });

      for (const neighborNode of neighborNodes) {
        const neighborNodeKey = neighborNode.airport.iata;
        const isNodeInCameFrom = cameFrom.has(neighborNodeKey);

        // Skip the neighbor node if it's been abandoned
        if (abandonNodes.has(neighborNodeKey)) {
          continue;
        }

        // Skip the neighbor node if it has an infinite fScore
        if (neighborNode.fScore === Infinity) {
          abandonNodes.add(neighborNodeKey);
          continue;
        }

        if (!isNodeInCameFrom || neighborNode.fScore < cameFrom.get(neighborNodeKey)!.fScore) {
          cameFrom.set(neighborNodeKey, neighborNode);
          openSet.push(neighborNode);
        } else if (cameFrom.has(neighborNodeKey)) {
          // If visited and new path is better, abandon the node.
          abandonNodes.add(neighborNodeKey);
        }
      }
    }

    // No path is found.
    return null;
  }

  /**
   * Reconstruct the path from the cameFrom map.
   */
  private static reconstructPath(
    cameFrom: Map<string, AirportNode | null>,
    destinationNode: AirportNode,
  ) {
    let currentNode: AirportNode | null = destinationNode;
    const path: RouteData[] = [];

    while (currentNode !== null) {
      const parentNode = currentNode.parent;
      if (parentNode) {
        const { routeToParent } = currentNode;

        // Validation
        if (!routeToParent) throw new ReferenceError("Route to parent is not found.");

        if (routeToParent.fromAirport.iata !== parentNode.airport.iata) {
          throw new ValidationError(
            `Route from ${routeToParent.fromAirport.iata} to ${routeToParent.toAirport.iata} is not matched with parent node ${parentNode.airport.iata}`,
          );
        }

        if (routeToParent.toAirport.iata !== currentNode.airport.iata) {
          throw new ValidationError(
            `Route from ${routeToParent.fromAirport.iata} to ${routeToParent.toAirport.iata} is not matched with parent node ${currentNode.airport.iata}`,
          );
        }

        // Construct route data
        const currentRoute: RouteData = {
          from: parentNode,
          to: currentNode,
          route: routeToParent,
        };
        path.unshift(currentRoute);
        const prevNode = cameFrom.get(parentNode.airport.iata);
        currentNode = prevNode ?? null;
      } else {
        currentNode = null;
      }
    }

    return path;
  }

  /**
   * When search route between node A and B that has no direct route.
   * Applying Genetic Greedy Algorithm here to optimize and return best candiates to A star search.
   * In order to cut down the size of population.
   */
  private static async getNeighborNodes(data: CalculateNodeParams) {
    // Sub Function to call for optimized candiates
    const callForOptimizedCandidates = async (candidates: AirportNode[]) => {
      const optimizedCandidates = await this.optimizeNeighborNodes({
        initialPopulation: candidates,
        destination: data.destination,
        travelDocs: data.travelDocs,
        visaInfos: data.visaInfos,
        airportNodeCache: data.airportNodeCache,
        ruleSets: data.ruleSet,
      });
      return optimizedCandidates;
    };

    // Get the available flight routes
    const currNeighborRoutes = await this.getFlightRoutesFrom(data.currentNode.airport);
    const destinationRoutes = await this.getFlightRoutesTo(data.destination);

    // Create the initial population of neighboring airport nodes
    // If has optimal candidates, use optimal cantidates to perform GGA
    // Otherwise, use all poential neighbors here
    const initialPopulation: AirportNode[] = [];
    const optimalPopulation: AirportNode[] = [];

    for (const route of currNeighborRoutes) {
      const neighborNode = data.airportNodeCache.get(route.toAirport.iata)
        ?? this.createAirportNode(route.toAirport, data.currentNode);
      neighborNode.routeToParent = route;
      neighborNode.nodeToParentCount += 1;
      neighborNode.distanceSoFar += route.distance;

      const routeToDestination = destinationRoutes.find((desRoute) => (
        desRoute.fromAirport.iata === neighborNode.airport.iata
      ));

      // If the node has route to the destination, add the info into object
      // Also apply greedy here for turn down the candidate size
      if (routeToDestination) {
        neighborNode.routeToDestination = routeToDestination;
        optimalPopulation.push(neighborNode);
      } else {
        initialPopulation.push(neighborNode);
      }
    }

    let finalCandidates: AirportNode[] = [];
    if (optimalPopulation.length) {
      const optimizedCandidatesList = await Promise.all([
        callForOptimizedCandidates(optimalPopulation),
        callForOptimizedCandidates(initialPopulation),
      ]);
      finalCandidates = [...optimizedCandidatesList[0], ...optimizedCandidatesList[1]];
    } else {
      finalCandidates = await callForOptimizedCandidates(initialPopulation);
    }

    // Return result
    return finalCandidates.sort((a, b) => a.fScore - b.fScore);
  }

  /**
   * Return node score for A* algorithm. Higher score mean lower priority
   * It should use multiple conditions to return the score, and can dynamic
   * applied the rule defined later.
   */
  private static async calculateAStarScore(data: CalculateNodeParams) {
    const { currentNode, destination, travelDocs, visaInfos, ruleSet } = data;
    const { gScore, nodeToParentCount } = currentNode;
    const currentCountry = currentNode.airport.country;
    const visaRule = ruleSet?.find((rule) => rule.type);

    // Factor
    /// Normalize, use raw value here are transit is more painful than direct flight
    const nodeCountFactor = nodeToParentCount / 1;

    // H score
    const heuristicRawScore = this.calculateHeuristic(currentNode, data.destination);
    /// Normalize, but value is larger to prevent mutate value affect optimal path
    const heuristicScore = (heuristicRawScore / 20037) * 5;

    // G score
    const tentativeGScore = gScore + heuristicScore;

    // Visa Score
    let visaScore = 0;
    if (
      currentNode.parent
      // Do not need to calculate again if transit via the same country
      // Or if it is the same country as destination
      && (currentNode.parent.airport.country !== currentCountry
        || currentCountry === destination.country)
    ) {
      const rawScore = await this.calculateVisaScore(
        travelDocs,
        visaInfos,
        currentCountry.code,
      );
      visaScore = rawScore / 1000; // Normalize
    }

    // If there is custom rule for visa
    if (visaRule) {
      visaScore *= visaRule.weight;
    }

    // Final Others score
    const ruleScore = visaScore + nodeCountFactor;
    /// Make the final score have more weigh than the heuristic score (distance)
    /// This should prevent program always prefer shorter distance even there is visa requirement.
    const finalScore = ruleScore * 50;

    // F score
    const totalCost = tentativeGScore + heuristicScore + finalScore;

    return { gScore: tentativeGScore, hScore: heuristicScore, fScore: totalCost };
  }

  /**
   * Calculate score based on visa requirement
   */
  private static async calculateVisaScore(
    travelDocs: TravelDocInfo[],
    visaInfos: VisaInfo[],
    currentCountry: string,
  ) {
    const db = Database.getInstance();
    const { em } = db;

    // Helper function that check visa requirement for current document
    // if true skip calculate score
    const checkVisaRequirement = (requirement: VisaPolicyEntity) => {
      if (
        travelDocs.some((doc) => doc.nationality === currentCountry)
        || requirement.visaRequirementType === "visa free"
        || requirement.visaRequirementType === "freedom of movement"
      ) {
        return true;
      }

      // Handle the case that held other countries visa but also can visa free entry, such as US PR
      const { specialVisaRequirements } = requirement;
      const isSpecialApplicable = specialVisaRequirements?.some((special) => {
        const isHasVisa = visaInfos.some((visa) => (
          // a foreign visa that can have visa free to current country
          visa.country === special.countryCode && visa.type === special.visaType
        ));
        return isHasVisa;
      });

      if (isSpecialApplicable) {
        return true;
      }

      // Return based on current visa info
      return visaInfos.some((v) => v.country === currentCountry);
    };

    const visaRequirements = await Promise.all(travelDocs.map(async (doc) => {
      if (doc.nationality === currentCountry) {
        return { visaRequirementType: "freedom of movement" };
      }
      try {
        const visaPolicy = await em.findOneOrFail(
          VisaPolicyEntity,
          {
            fromCountry: doc.nationality,
            toCountry: currentCountry,
          },
        );
        return visaPolicy;
      } catch (err) {
        return { visaRequirementType: "unknown" };
      }
    }));

    // Generate the final visa score
    let visaScore = 1;
    const isVisaNotRequired = visaRequirements.some((v) => {
      switch (v.visaRequirementType) {
        case "unknown":
          return false;
        case "visa free":
        case "freedom of movement":
          return true;
        default:
          return checkVisaRequirement(v as VisaPolicyEntity);
      }
    });
    if (isVisaNotRequired) {
      visaScore = 1;
    } else {
      const potentialScore: number[] = [];
      visaRequirements.forEach((v) => {
        let currScore = 0;
        switch (v.visaRequirementType) {
          // E-visa is nearly same as visa-free
          case "e-visa":
            currScore = 10;
            break;
          // visa on arrival is nearly same as visa-free, but not like E-visa
          case "visa on arrival":
            currScore = 50;
            break;
          case "visa required":
            currScore = 1000; // Add higher score to let program avoid node that need visa
            break;
          case "no admission":
          default:
            currScore = Infinity;
            break;
        }
        potentialScore.push(currScore);
      });
      // Get the smallest score
      visaScore = potentialScore.sort((a, b) => b - a).pop()!;
    }

    return visaScore;
  }

  /**
   * Utilize the heuristic function to calculate the heuristic score for A* algorithm.
   */
  private static calculateHeuristic(node: AirportNode, destination: AirportEntity) {
    // Helpers
    const degreesToRadians = (degree: number) => (degree * (Math.PI / 180));

    // Terminate early if it is the final node to destination
    if (node.routeToDestination) {
      return node.routeToDestination.distance;
    }

    // Initialize
    const { airport } = node;
    const earthRadiusKm = 6371;

    // Using Haversine formula to estimate the remaining distance
    const deltaLat = degreesToRadians(destination.latitude - airport.latitude);
    const deltaLon = degreesToRadians(destination.longitude - airport.longitude);

    const halfChordLength = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
      + Math.cos(degreesToRadians(destination.latitude))
        * Math.cos(degreesToRadians(airport.latitude))
        * Math.sin(deltaLon / 2)
        * Math.sin(deltaLon / 2);
    const angularDistance = 2
      * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));
    const estimatedRemainDistance = earthRadiusKm * angularDistance;

    return estimatedRemainDistance;
  }

  // GGA helpers //

  private static async optimizeNeighborNodes(
    data: {
      initialPopulation: AirportNode[];
      destination: AirportEntity;
      travelDocs: { nationality: string; type: string }[];
      visaInfos: { country: string; type: string }[];
      airportNodeCache: Map<string, AirportNode>;
      ruleSets?: RuleSet[];
    },
  ) {
    // Helpers
    const crossover = (firstNode: AirportNode, secondNode: AirportNode) => {
      const childNode = this.createAirportNode(firstNode.airport, firstNode.parent);
      childNode.routeToParent = firstNode.routeToParent;
      childNode.routeToDestination = firstNode.routeToDestination;
      childNode.gScore = firstNode.gScore;
      childNode.hScore = secondNode.hScore;
      childNode.nodeToParentCount = Math.min(
        firstNode.nodeToParentCount,
        secondNode.nodeToParentCount,
      );
      childNode.distanceSoFar = firstNode.distanceSoFar;
      childNode.fScore = firstNode.fScore;
      return childNode;
    };

    const mutate = (individualNode: AirportNode) => {
      const { gScore, hScore, nodeToParentCount, distanceSoFar } = individualNode;
      const mutateRate = 0.005;
      const gScoreMutated = gScore * (1 + Math.random() * mutateRate);
      const hScoreMutated = hScore * (1 + Math.random() * mutateRate);
      // const nodeToParentMutated = Math.floor(
      //   nodeToParentCount * (1 + Math.random() * mutateRate),
      // );
      const distanceSoFarMutated = distanceSoFar * (1 + Math.random() * mutateRate);
      return {
        gScore: gScoreMutated,
        hScore: hScoreMutated,
        // nodeToParentCount: nodeToParentMutated,
        nodeToParentCount,
        distanceSoFar: distanceSoFarMutated,
      };
    };

    // Destruct property
    const { initialPopulation } = data;

    const populationSize = 100;
    const numGenerations = 10;
    const mutationRate = 0.8;

    // Initialize the population
    let population = initialPopulation.slice(0, populationSize);

    for (let i = 0; i < numGenerations; i += 1) {
      const scores = await Promise.all(population.map(async (node) => {
        const score = await this.calculateAStarScore({
          currentNode: node,
          destination: data.destination,
          travelDocs: data.travelDocs,
          visaInfos: data.visaInfos,
          airportNodeCache: data.airportNodeCache,
          ruleSet: data.ruleSets,
        });
        return score;
      }));

      // Sort the population based on the scores
      const sortedPopulation = population.map((node, index) => ({ node, score: scores[index] }))
        .sort((a, b) => a.score.fScore - b.score.fScore)
        .map(({ node, score }) => {
          // eslint-disable-next-line no-param-reassign
          node.gScore = score.gScore;
          // eslint-disable-next-line no-param-reassign
          node.hScore = score.hScore;
          // eslint-disable-next-line no-param-reassign
          node.fScore = score.fScore;
          return node;
        });

      const parents = sortedPopulation.slice(0, Math.floor(populationSize / 2));

      // Perform crossover and mutation to generate the next generation
      const nextGeneration: AirportNode[] = [];
      while (nextGeneration.length < populationSize) {
        const firstParent = parents[Math.floor(Math.random() * parents.length)];
        const secondParent = parents[Math.floor(Math.random() * parents.length)];
        const childNode = crossover(firstParent, secondParent); // Cross over

        if (Math.random() < mutationRate) {
          const { gScore, hScore, nodeToParentCount, distanceSoFar } = mutate(childNode);
          childNode.gScore = gScore;
          childNode.hScore = hScore;
          childNode.nodeToParentCount = nodeToParentCount;
          childNode.distanceSoFar = distanceSoFar;
        }

        nextGeneration.push(childNode);
      }

      population = nextGeneration;
    }

    return population;
  }

  // Flight Routes Helpers //

  /**
   * Get flight route between two airports.
   */
  private static async getFlightRouteBetween(from: AirportEntity, to: AirportEntity) {
    // Databse
    const db = Database.getInstance();
    const { em } = db;

    // Search Route
    const routeInfo = await em.findOne(
      RouteEntity,
      { fromAirport: from, toAirport: to },
      {
        populate: [
          "fromAirport",
          "toAirport",
          "distance",
          "fromAirport.iata",
          "toAirport.iata",
          "fromAirport.country",
          "toAirport.country",
        ],
      },
    );

    // Return value
    return routeInfo;
  }

  /**
   * Get flight routes from an airport.
   */
  private static async getFlightRoutesFrom(from: AirportEntity) {
    // Database
    const db = Database.getInstance();
    const { em } = db;

    // Search
    const routesInfo = await em.find(
      RouteEntity,
      { fromAirport: from },
      {
        populate: [
          "fromAirport",
          "toAirport",
          "distance",
          "fromAirport.iata",
          "toAirport.iata",
          "fromAirport.country",
          "toAirport.country",
        ],
      },
    );

    // Return value
    return routesInfo;
  }

  /**
   * Get flight routes to an airport.
   */
  private static async getFlightRoutesTo(to: AirportEntity) {
    // Database
    const db = Database.getInstance();
    const { em } = db;

    // Search
    const routesInfo = await em.find(
      RouteEntity,
      { toAirport: to },
      {
        populate: [
          "fromAirport",
          "toAirport",
          "distance",
          "fromAirport.iata",
          "toAirport.iata",
          "fromAirport.country",
          "toAirport.country",
        ],
      },
    );

    // Return value
    return routesInfo;
  }
}

export default FlightRouteService;
