import {useQuery, gql} from "@apollo/client";
import Homepage from "./Homepage";
import React from "react";
import {validate, version} from "uuid";

const QUERY_BAR = gql`
    query MyQuery($barConnectionId: uuid!) {
      bars(where: {bar_connection_id: {_eq: $barConnectionId}}) {
        bar_id
      }
    }
`;

export default function UUIDValidation() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const paramB = urlSearchParams.get('b');
    const barConnectionId = paramB ? (validate(paramB) && version(paramB) === 4 ? paramB : undefined) : undefined;

    return barConnectionId ?
        <Bar barConnectionId={barConnectionId} />
        : <p>Recherche de bars impossible...</p>;
};

function Bar({ barConnectionId }) {
    const {data, loading, error} = useQuery(QUERY_BAR, { variables : { barConnectionId }});

    return loading ?
        <p>Chargement...</p>
        : (
            data && data.bars.length ?
                <Homepage barId={data.bars[0].bar_id} />
                : (
                    error ?
                        <p>Une erreur est survenue...</p>
                        : <p>Aucun bar trouvé...</p>
                )
        );
}
