import React, { createContext, useContext, useEffect, useReducer } from "react";
import { getAirportList, getCountriesList } from "../api/data.api";
import type { AirportEnity, CountryEntity } from "../types/data";
import type { FlightRouteParams, ResultRoute } from "../types/flightroute";

export interface AppState {
  countries: CountryEntity[];
  airports: AirportEnity[];
  travellerInfo: Pick<FlightRouteParams, "travelDocs" | "visaInfos">;
  /** Store itineraries records */
  itineraries: { airport?: AirportEnity; input: string }[];
  /** Store result route records */
  resultRoutes: ResultRoute[];
  errMsg: { id: string; isNoticed: boolean; msg: string }[];
}

export const initialState: AppState = {
  countries: [],
  airports: [],
  travellerInfo: { travelDocs: [], visaInfos: [] },
  itineraries: Array.from({ length: 2 }, () => ({ input: "" })),
  resultRoutes: [],
  errMsg: [],
};

type AppActionInterface<T extends string, U> = {
  type: T;
  payload: U;
};

export enum AppActionTypes {
  SET_AIRPORTS = "SET_AIRPORTS",
  SET_COUNTRIES = "SET_COUNTRIES",
  SET_ITINERARIES = "SET_ITINERARIES",
  SET_TRAVEL_DOCS = "SET_TRAVEL_DOCS",
  SET_VISA_INFOS = "SET_VISA_INFO",
  SET_ERR_MSG = "SET_ERR_MSG",
  SET_RESULT_ROUTES = "SET_RESULT_ROUTES",
  RESET_ITINERARIES = "RESET_ITINERARIES",
  SEARCH_ROUTES = "SEARCH_ROUTES",
}

type AppAction =
  | AppActionInterface<AppActionTypes.SET_AIRPORTS, AirportEnity[]>
  | AppActionInterface<AppActionTypes.SET_COUNTRIES, CountryEntity[]>
  | AppActionInterface<AppActionTypes.SET_ITINERARIES, { airport?: AirportEnity; input: string }[]>
  | AppActionInterface<AppActionTypes.SET_TRAVEL_DOCS, FlightRouteParams["travelDocs"]>
  | AppActionInterface<AppActionTypes.SET_VISA_INFOS, FlightRouteParams["visaInfos"]>
  | AppActionInterface<
    AppActionTypes.SET_ERR_MSG,
    { id: string; isNoticed: boolean; msg: string }[]
  >
  | AppActionInterface<
    AppActionTypes.SET_RESULT_ROUTES,
    ResultRoute[]
  >
  | AppActionInterface<AppActionTypes.RESET_ITINERARIES, undefined>
  | AppActionInterface<AppActionTypes.SEARCH_ROUTES, undefined>;

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> }>({
  state: initialState,
  dispatch: () => undefined,
});

const reducer = (state: AppState, action: AppAction) => {
  switch (action.type) {
    case AppActionTypes.SET_AIRPORTS: {
      return { ...state, airports: action.payload };
    }
    case AppActionTypes.SET_COUNTRIES: {
      return { ...state, countries: action.payload };
    }
    case AppActionTypes.SET_ITINERARIES: {
      return { ...state, itineraries: action.payload };
    }
    case AppActionTypes.SET_TRAVEL_DOCS: {
      return { ...state, travellerInfo: { ...state.travellerInfo, travelDocs: action.payload } };
    }
    case AppActionTypes.SET_VISA_INFOS: {
      return { ...state, travellerInfo: { ...state.travellerInfo, visaInfos: action.payload } };
    }
    case AppActionTypes.SET_ERR_MSG: {
      return { ...state, errMsg: action.payload };
    }
    case AppActionTypes.SET_RESULT_ROUTES: {
      return { ...state, resultRoutes: action.payload };
    }
    case AppActionTypes.RESET_ITINERARIES: {
      return {
        ...state,
        itineraries: Array.from({ length: 2 }, () => ({ input: "" })),
        resultRoutes: [],
      };
    }
    default: {
      return { ...state };
    }
  }
};

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const fetchData = async () => {
      const airports = await getAirportList();
      dispatch({ type: AppActionTypes.SET_AIRPORTS, payload: airports });

      const countries = await getCountriesList();
      dispatch({ type: AppActionTypes.SET_COUNTRIES, payload: countries });
    };
    fetchData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => useContext(AppContext);
