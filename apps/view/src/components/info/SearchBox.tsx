import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Col,
  Container,
  Dropdown,
  Form,
  InputGroup,
  Row,
} from "react-bootstrap";
import { GeoAltFill, ThreeDotsVertical, XCircle } from "react-bootstrap-icons";
import { useI18n } from "react-simple-i18n";
import getFlightRouteResult from "../../api/flightroute.api";
import { AppActionTypes, useAppStore } from "../../hooks/AppContext";
import type { AirportEnity } from "../../types/data";
import type { FlightRouteParams } from "../../types/flightroute";

const SearchBox = () => {
  const { state, dispatch } = useAppStore();
  const { airports, travellerInfo, itineraries } = state;
  const { t, i18n } = useI18n();
  /** Check is it able to add new destinations */
  const [isLoading, setIsLoading] = useState(false);
  const [isAllowToReset, setIsAllowToReset] = useState(false);
  const [isAllowToSearch, setIsAllowToSearch] = useState(false);
  const [isAllowToAdd, setIsAllowToAdd] = useState(false);

  // Hook to check status of itineraries input
  useEffect(() => {
    const isTravelDocsFilled = Boolean(travellerInfo.travelDocs.length);
    const isValidItineraies = itineraries.every((itinerary) => itinerary.airport);
    const isAllowToReset = itineraries.some((itinerary) => itinerary.airport || itinerary.input);

    // Set allow to add
    if (isValidItineraies && itineraries.length < 5) {
      setIsAllowToAdd(true);
    } else {
      setIsAllowToAdd(false);
    }

    // Set allow to search
    if (isTravelDocsFilled && isValidItineraies) {
      setIsAllowToSearch(true);
    } else {
      setIsAllowToSearch(false);
    }

    // Set allow to reset
    if (isAllowToReset) {
      setIsAllowToReset(true);
    } else {
      setIsAllowToReset(false);
    }
  }, [itineraries, travellerInfo]);

  // Methods //

  const getAirportName = (airport: AirportEnity) => {
    const lang = i18n.getLang();
    const localizedName = airport?.localizedName?.[lang];
    return localizedName ?? airport.name;
  };

  const searchAirports = (input: string) => {
    const inputUpper = input.toUpperCase();
    const lang = i18n.getLang();
    const result = airports.filter((airport) => {
      const iata = airport.iata.toUpperCase();
      const name = airport.name.toUpperCase();
      const cityName = airport.cityName.toUpperCase();
      const localizedName = airport?.localizedName?.[lang].toUpperCase();
      const localizedCityName = airport?.localizedCityName?.[lang].toUpperCase();
      return iata.includes(inputUpper)
        || name.includes(inputUpper)
        || cityName.includes(inputUpper)
        || localizedName?.includes(inputUpper)
        || localizedCityName?.includes(inputUpper);
    });

    // Sort result, prioritize IATA
    result.sort((a, b) => {
      const aIsIataMatch = a.iata.toUpperCase() === inputUpper;
      const bIsIataMatch = b.iata.toUpperCase() === inputUpper;

      // If one of them is an exact IATA match, prioritize it
      if (aIsIataMatch && !bIsIataMatch) return -1;
      if (!aIsIataMatch && bIsIataMatch) return 1;

      return 0;
    });
    return result.slice(0, 5);
  };

  const handleItinerariesChange = (
    index: number,
    data: { airport?: AirportEnity; input?: string },
  ) => {
    const { airport, input } = data;
    const newItineraries = [...itineraries];
    newItineraries[index] = { ...itineraries[index], airport, input: input ?? "" };
    dispatch({ type: AppActionTypes.SET_ITINERARIES, payload: newItineraries });
  };

  const addItinerary = () => {
    const newItineraries = [...itineraries, { input: "" }];
    dispatch({ type: AppActionTypes.SET_ITINERARIES, payload: newItineraries });
  };

  const removeItinerary = (index: number) => {
    const newItineraries = [...itineraries].filter((_, i) => i !== index);
    dispatch({ type: AppActionTypes.SET_ITINERARIES, payload: newItineraries });
  };

  const resetItinerary = () => {
    dispatch({ type: AppActionTypes.RESET_ITINERARIES, payload: undefined });
  };

  const isInvalidInput = (index: number) => {
    const itinerary = itineraries[index];
    const { airport, input } = itinerary;
    if (input) {
      return !Boolean(airport);
    }
    return false;
  };

  /**
   * Call API to perform route search
   */
  const searchRoutes = async () => {
    try {
      setIsLoading(true);
      const flightItineraries = [...itineraries].map((itinerary) => itinerary.airport!.iata!);
      const fromAirport = flightItineraries.shift();
      const toAirport = flightItineraries.pop();
      const paramsBody: FlightRouteParams = {
        ...travellerInfo,
        from: fromAirport!,
        to: toAirport!,
        transitThrough: flightItineraries.length ? flightItineraries : undefined,
      };
      const result = await getFlightRouteResult(paramsBody);
      dispatch({ type: AppActionTypes.SET_RESULT_ROUTES, payload: result });
    } catch (err) {
      if (err instanceof Error) {
        const id = Math.random().toString();
        const message = err.message;
        const newErrList = [...state.errMsg, { id, isNoticed: false, msg: message }].filter((err) =>
          !err.isNoticed
        );
        dispatch({ type: AppActionTypes.SET_ERR_MSG, payload: newErrList });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid>
      <Row className="mt-2 md-1">
        <Form noValidate>
          {itineraries.map((itinerary, index) => (
            <InputGroup key={index}>
              <>
                {index !== itineraries.length - 1
                  ? <ThreeDotsVertical className="d-flex align-self-center me-2" />
                  : <GeoAltFill className="d-flex align-self-center me-2" />}
              </>
              <Form.Control
                className="mt-1 md-1"
                size="sm"
                placeholder={index
                  ? t("searchBox.placeholder.destination")
                  : t("searchBox.placeholder.departure")}
                value={itinerary.airport ? getAirportName(itinerary.airport) : itinerary.input}
                onChange={(e) => handleItinerariesChange(index, { input: e.target.value })}
                isInvalid={isInvalidInput(index)}
                required
              />
              {itineraries.length > 2 && (
                <Button
                  title={t("searchBox.delete")}
                  className="mt-1 md-1"
                  variant="outline-secondary"
                  onClick={() => removeItinerary(index)}
                >
                  <XCircle />
                </Button>
              )}
              {itinerary.input && (() => {
                const filteredAirports = searchAirports(itinerary.input);
                if (filteredAirports.length === 0) return null;
                return (
                  <Container className="p-0">
                    <Dropdown show={Boolean(itinerary.input)} autoClose="inside">
                      <Dropdown.Menu className="position-fixed" align="start">
                        {searchAirports(itinerary.input).map((airport) => (
                          <Dropdown.Item
                            key={airport.iata}
                            onClick={() => handleItinerariesChange(index, { airport })}
                          >
                            {getAirportName(airport)}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Container>
                );
              })()}
              <Form.Control.Feedback type="invalid">
                {t("searchBox.invalidInput")}
              </Form.Control.Feedback>
            </InputGroup>
          ))}
        </Form>
      </Row>
      <Row className="mt-2 md-1 align-items-center justify-content-between">
        <Col className="p-0 flex-grow-1">
          {isAllowToAdd && (
            <Button
              variant="outline-secondary"
              onClick={() => addItinerary()}
            >
              {t("searchBox.addNew")}
            </Button>
          )}
        </Col>
        <Col className="p-0 text-end">
          {isAllowToReset && (
            <Button
              variant="outline-danger"
              className="me-1"
              onClick={() => resetItinerary()}
            >
              {t("searchBox.reset")}
            </Button>
          )}
          <Button
            variant="primary"
            className="ms-1"
            onClick={async () => await searchRoutes()}
            disabled={!isAllowToSearch || !isLoading}
          >
            {t("search")}
          </Button>
        </Col>
      </Row>
      {
        /* {!isAllowToSearch && (
        <Container className="bg-white p-4 rounded">
          <p>{t("travelerInfo.initMsg")}</p>
        </Container>
      )} */
      }
    </Container>
  );
};

export default SearchBox;
