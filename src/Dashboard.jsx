import React, {useEffect, useState} from "react";

import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

const QUERY_TABLES_AND_DRINKS = gql`
    query MyQuery($barId: uuid!) {
      tables(where: {bar_id: {_eq: $barId}, table_deleted_at: {_is_null: true}}, order_by: {table_name: asc}) {
        table_name
        table_id
      }
      drinks(where: {bar_id: {_eq: $barId}, drink_deleted_at: {_is_null: true}}, order_by: {drink_name: asc}) {
        drink_name
        drink_price
        drink_id
      }
    }
`;

const DELETE_TABLES = gql`
    mutation MyMutation($tableId: uuid!) {
      update_tables(where: {table_id: {_eq: $tableId}}, _set: {table_deleted_at: "now()"}) {
        affected_rows
      }
    }
`;

const INSERT_TABLE = gql`
    mutation MyMutation2($tableName: name, $barId: uuid) {
      insert_tables_one(object: {bar_id: $barId, table_name: $tableName}) {
        table_id
      }
    }
`;

const DELETE_DRINKS = gql`
    mutation MyMutation($drinkId: uuid!) {
      update_drinks(where: {drink_id: {_eq: $drinkId}}, _set: {drink_deleted_at: "now()"}) {
        affected_rows
      }
    }
`;

const INSERT_DRINKS = gql`
    mutation MyMutation2($drinkName: name, $drinkPrice: name, $barId: uuid) {
      insert_drinks_one(object: {bar_id: $barId, drink_name: $drinkName, drink_price: $drinkPrice}) {
        drink_id
      }
    }
`;


export default function Dashboard({ barId }) {

    const { data, loading } = useQuery(QUERY_TABLES_AND_DRINKS, { variables : { barId }});
    const [ dataTables, setDataTables ] = useState(data ? data.tables : []);
    const [ deleteTables ] = useMutation(DELETE_TABLES);
    const [ insertTable ] = useMutation(INSERT_TABLE);

    const [ dataDrinks, setDataDrinks ] = useState(data ? data.drinks : []);
    const [ deleteDrinks ] = useMutation(DELETE_DRINKS);
    const [ insertDrink ] = useMutation(INSERT_DRINKS);

    useEffect(() => {
        if (data) {
            if (data.tables.length) {
                setDataTables(data.tables);
            }
            if (data.drinks.length) {
                setDataDrinks(data.drinks);
            }
        }
    }, [data]);

    const handleOnClickTableCross = tableId => {
        deleteTables({variables : { tableId }})
            .then(() => {
                setDataTables(d => d.filter(({table_id}) => table_id !== tableId));
            });
    };

    const handleOnClickDrinkCross = drinkId => {
        deleteDrinks({variables : { drinkId }})
            .then(() => {
                setDataDrinks(d => d.filter(({drink_id}) => drink_id !== drinkId));
            });
    };

    const handleSubmitFormTable = () => {
        const tableName = document.getElementById('tableNameInput').value;

        console.log(tableName)
        if (tableName) {
        insertTable({variables : { tableName, barId }})
            .then(({data: {insert_tables_one: {table_id}}}) => {
                setDataTables(d => [...d, {table_id, table_name: tableName}]);
            })
            .then(() => document.getElementById('tableNameInput').value = '')
        }
    };

    const handleSubmitFormDrink = () => {
        const drinkName = document.getElementById('drinkNameInput').value;
        const drinkPrice = document.getElementById('drinkPriceInput').value;

        console.log(drinkPrice, drinkName)

        if (drinkName && drinkPrice) {
            insertDrink({variables : { drinkName, drinkPrice, barId }})
                .then(({data: {insert_drinks_one: {drink_id}}}) => {
                    setDataDrinks(d => [...d, {drink_id, drink_name: drinkName, drink_price: drinkPrice}]);
                })
                .then(() => {
                    document.getElementById('drinkNameInput').value = '';
                    document.getElementById('drinkPriceInput').value = '';
                });
        }
    };

    const displayTables = dataTables ?
        dataTables.map(({ table_name: tableName, table_id: tableId }) => (
            <div
                key={tableId}
                className="
                        inline-block
                        bg-gray-200
                        rounded-full
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-gray-700
                        w-1/6
                        mr-2
                        ml-2
                        mt-3
                        hover:bg-gray-900
                        transform
                        hover:translate-y-1
                        hover:scale-105
                        hover:shadow-2xl
                        hover:text-white
                        transition
                        duration-500
                    "
            >
                <span>
                    {tableName}
                </span>
                <span className="float-right cursor-pointer" onClick={() => handleOnClickTableCross(tableId)}>
                    X
                </span>
            </div>
        ))
        : null;


    const displayDrinks = dataDrinks ?
        dataDrinks.map(({ drink_name: drinkName, drink_id: drinkId, drink_price: drinkPrice }) => (
            <div
                key={drinkId}
                className="
                        inline-block
                        bg-gray-200
                        rounded-full
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-gray-700
                        w-1/5
                        mr-2
                        ml-2
                        mt-3
                        hover:bg-gray-900
                        transform
                        hover:translate-y-1
                        hover:scale-105
                        hover:shadow-2xl
                        hover:text-white
                        transition
                        duration-500
                    "
            >
                <span>
                    {drinkName} - {drinkPrice}€
                </span>
                <span className="float-right cursor-pointer" onClick={() => handleOnClickDrinkCross(drinkId)}>
                    X
                </span>
            </div>
        ))
        : null;

    return loading ?
            <div className="flex justify-center">
                <div
                    className="
                        inline-block
                        bg-gray-200
                        rounded-full
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-gray-700
                        w-1/4
                        flex justify-center mt-10 mb-10
                    "
                >
                    Chargement des données
                </div>
            </div>
        :
            <>
                <div className="flex justify-center">
                    <div className="flex justify-center mt-5 mb-5 py-1 border-b-2 border-gray-600 w-56">
                        Tables
                    </div>
                </div>
                <div className="flex justify-center mt-10 mb-10">
                    <form id="formTable" className="w-1/5 mr-56" onSubmit={e => {e.preventDefault(); e.stopPropagation(); handleSubmitFormTable();}}>
                        <div className="flex items-center border-b border-gray-500 py-2">
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="text" placeholder="Ajouter une table" aria-label="Table name" id="tableNameInput" />
                            <button
                                className="flex-shrink-0 bg-gray-500 hover:bg-gray-700 border-gray-500 hover:border-gray-700 text-sm border-4 text-white py-1 px-2 rounded"
                                type="submit">
                                Ajouter
                            </button>
                        </div>
                    </form>
                    <div className="w-1/2">
                        {displayTables}
                    </div>
                </div>
                <div className="border-2" />
                <div className="flex justify-center">
                    <div className="flex justify-center mt-5 mb-5 py-1 border-b-2 border-gray-600 w-56">
                        Boissons
                    </div>
                </div>
                <div className="flex justify-center mt-10 mb-10">
                    <form id="formDrink" className="w-1/5 mr-56" onSubmit={e => {e.preventDefault(); e.stopPropagation(); handleSubmitFormDrink();}}>
                        <div className="flex items-center border-b border-gray-500 py-2">
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="text" placeholder="Nom boisson" aria-label="Drink name" id="drinkNameInput" />
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="text" placeholder="Prix boisson" aria-label="Drink price" id="drinkPriceInput" />
                            <button
                                className="flex-shrink-0 bg-gray-500 hover:bg-gray-700 border-gray-500 hover:border-gray-700 text-sm border-4 text-white py-1 px-2 rounded"
                                type="submit">
                                Ajouter
                            </button>
                        </div>
                    </form>
                    <div className="w-1/2">
                        {displayDrinks}
                    </div>
                </div>
            </>;
}
