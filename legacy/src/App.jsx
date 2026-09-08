import "./App.css";

import { CountrySelector } from "./components/controls";
import World from "./components/world";
import { useState } from "react";
import { CountryContext } from "./context";
import styled from "styled-components";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Earth } from "./components/main";
import { TopSection } from "./components/topSection";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserWorld from "./components/userWorld";

function App() {
  const [countries, setCountries] = useState([]); // []

  const handleChangeCountry = ({ value }) => {
    setCountries((prevState) => [...prevState, value]); // usa
  };

  const handleDeleteCountry = ({ value }) => {
    const newCountries = countries.filter((country) => country !== value);
    setCountries(newCountries);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <TopSection />
              <Canvas>
                <Suspense fallback={null}>
                  <Earth />
                </Suspense>
              </Canvas>
            </>
          }
        />
        <Route
          path="create"
          element={
            <CountryContext.Provider
              value={{ handleChangeCountry, countries, handleDeleteCountry }}
            >
              <World />
              {/* <CountrySelector /> */}
            </CountryContext.Provider>
          }
        />
        <Route path="/:id" element={<UserWorld />} />
      </Routes>
    </Router>
  );
}

export default App;
