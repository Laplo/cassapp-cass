import React from 'react';
import {validate, version} from "uuid";
import Provide from "./Bar";
import BarContext from "./BarContext";

function App() {

    const urlSearchParams = new URLSearchParams(window.location.search);
    const paramB = urlSearchParams.get('b');
    const barConnectionId = paramB ? (validate(paramB) && version(paramB) === 4 ? paramB : undefined) : undefined;

    return barConnectionId ?
        <BarContext.Provider value={{barConnectionId}}>
            <Provide />
        </BarContext.Provider>
        : <p>Recherche de bars impossible...</p>;
}

export default App;
