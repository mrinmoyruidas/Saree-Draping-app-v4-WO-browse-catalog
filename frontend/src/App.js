import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import VirtualTryOn from "./components/VirtualTryOn";
import SareeCatalog from "./components/SareeCatalog";
import Favorites from "./components/Favorites";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tryon" element={<VirtualTryOn />} />
          <Route path="/catalog" element={<SareeCatalog />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;