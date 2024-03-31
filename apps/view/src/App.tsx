import React from "react";
import { createI18n, I18nProvider, useI18n } from "react-simple-i18n";
import { AppContextProvider } from "./hooks/AppContext";
import langdata from "./localization/langdata.json";
import Home from "./pages/Home";
import "./App.css";
import "bootstrap/dist/css/bootstrap.css";

const App = () => {
  return (
    <AppContextProvider>
      <I18nProvider i18n={createI18n(langdata, { lang: "en" })}>
        <Home />
      </I18nProvider>
    </AppContextProvider>
  );
};

export default App;
