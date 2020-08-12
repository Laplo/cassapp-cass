import React, {useContext, useEffect, useState} from "react";

import create from 'zustand';

import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import BarContext from "./BarContext";

const QUERY_CATEGORIES = gql`
    query MyQuery($barId: uuid!) {
      categories(where: {bar_id: {_eq: $barId}, category_deleted_at: {_is_null: true}}, order_by: {category_name: asc}) {
        category_name
        category_id
      }
    }
`;

const DELETE_CATEGORIES = gql`
    mutation MyMutation($categoryId: uuid!) {
      update_categories(where: {category_id: {_eq: $categoryId}}, _set: {category_deleted_at: "now()"}) {
        affected_rows
      }
    }
`;

const INSERT_CATEGORY = gql`
    mutation MyMutation2($categoryName: name!, $barId: uuid!) {
      insert_categories_one(object: {bar_id: $barId, category_name: $categoryName}) {
        category_id
      }
    }
`;

const QUERY_TABLES_AND_ITEMS = gql`
    query MyQuery($barId: uuid!) {
      tables(where: {bar_id: {_eq: $barId}, table_deleted_at: {_is_null: true}}, order_by: {table_name: asc}) {
        table_name
        table_id
      }
      items(where: {category: {bar_id: {_eq: $barId}}, item_deleted_at: {_is_null: true}}, order_by: {item_name: asc}) {
        item_name
        item_price
        item_id
        category_id
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
    mutation MyMutation2($tableName: name!, $barId: uuid!) {
      insert_tables_one(object: {bar_id: $barId, table_name: $tableName}) {
        table_id
      }
    }
`;

const DELETE_ITEMS = gql`
    mutation MyMutation($itemId: uuid!) {
      update_items(where: {item_id: {_eq: $itemId}}, _set: {item_deleted_at: "now()"}) {
        affected_rows
      }
    }
`;

const INSERT_ITEMS = gql`
    mutation MyMutation2($itemName: name!, $itemPrice: Int!, $categoryId: uuid!) {
      insert_items_one(object: {item_name: $itemName, item_price: $itemPrice, category_id: $categoryId}) {
        item_id
      }
    }
`;

const [, categoriesApi] = create(() => ({
    cached: false,
    categories: []
}));
const [, tablesApi] = create(() => ({
    cached: false,
    tables: []
}));
const [, itemsApi] = create(() => ({
    cached: false,
    items: []
}));

const updateState = (datas, elementsName, cached, api) => {
    if (datas && datas[elementsName] && !cached) {
        const obj = {cached: true};
        obj[elementsName] = datas[elementsName];
        api.setState(obj);
    }
};

export default function Dashboard() {

    const { barId } = useContext(BarContext);

    const { data, loading } = useQuery(QUERY_TABLES_AND_ITEMS, { variables : { barId }});

    const { tables: storeTables, cached: tablesCached } = tablesApi.getState();
    const [ dataTables, setDataTables ] = useState(storeTables || (data ? data.tables : []));
    const [ deleteTables ] = useMutation(DELETE_TABLES);
    const [ insertTable ] = useMutation(INSERT_TABLE);
    tablesApi.subscribe(state => setDataTables(state.tables));

    const { items: storeItems, cached: itemsCached } = itemsApi.getState();
    const [ dataItems, setDataItems ] = useState(storeItems || (data ? data.items : []));
    const [ deleteItems ] = useMutation(DELETE_ITEMS);
    const [ insertItem ] = useMutation(INSERT_ITEMS);
    itemsApi.subscribe(state => setDataItems(state.items));

    const { categories: storeCategories, cached: categoriesCached } = categoriesApi.getState();
    const { data: datasCategories, loading: loadingCategories } = useQuery(QUERY_CATEGORIES, { variables : { barId }});
    const [ dataCategories, setDataCategories ] = useState(storeCategories || (datasCategories ? datasCategories.categories : []));
    const [ deleteCategories ] = useMutation(DELETE_CATEGORIES);
    const [ insertCategory ] = useMutation(INSERT_CATEGORY);
    categoriesApi.subscribe(state => setDataCategories(state.categories));

    useEffect(() => {
        updateState(data, 'tables', tablesCached, tablesApi);
    }, [data, tablesCached]);

    useEffect(() => {
        updateState(data, 'items', itemsCached, itemsApi);
    }, [data, itemsCached]);

    useEffect(() => {
        updateState(datasCategories, 'categories', categoriesCached, categoriesApi);
    }, [datasCategories, categoriesCached]);

    const handleOnClickTableCross = tableId => {
        deleteTables({variables : { tableId }})
            .then(() => {
                const tables = dataTables.filter(({table_id}) => table_id !== tableId);
                tablesApi.setState({tables});
            });
    };

    const handleOnClickItemCross = itemId => {
        deleteItems({variables : { itemId }})
            .then(() => {
                const items = dataItems.filter(({item_id}) => item_id !== itemId);
                itemsApi.setState({items});
            });
    };

    const handleOnClickCategoryCross = categoryId => {
        deleteCategories({variables : { categoryId }})
            .then(() => {
                const categories = dataCategories.filter(({category_id}) => category_id !== categoryId);
                categoriesApi.setState({categories});
            });
    };

    const handleSubmitFormTable = () => {
        const tableName = document.getElementById('tableNameInput').value;

        if (tableName) {
            insertTable({variables : { tableName, barId }})
                .then(({data: {insert_tables_one: {table_id}}}) => tablesApi.setState(d => ({ tables: [ ...d.tables, { table_id, table_name: tableName } ] })))
                .then(() => document.getElementById('tableNameInput').value = '')
        }
    };

    const handleSubmitFormItem = categoryId => {
        const itemName = document.getElementById(`${categoryId}NameInput`).value;
        const itemPrice = document.getElementById(`${categoryId}PriceInput`).value * 100;

        if (itemName && itemPrice) {
            insertItem({variables : { categoryId, itemName, itemPrice }})
                .then(({data: {insert_items_one: {item_id}}}) => {
                    itemsApi.setState(d => ({ items : [ ...d.items, { item_id, item_name: itemName, item_price: itemPrice, category_id: categoryId } ] }));
                })
                .then(() => {
                    document.getElementById(`${categoryId}NameInput`).value = '';
                    document.getElementById(`${categoryId}PriceInput`).value = '';
                });
        }
    };

    const handleSubmitFormCategory = () => {
        const categoryName = document.getElementById('categoryNameInput').value;

        if (categoryName) {
            insertCategory({variables : { categoryName, barId }})
                .then(({data: {insert_categories_one: {category_id}}}) => categoriesApi.setState(d => ({ categories: [ ...d.categories, { category_id, category_name: categoryName } ] })))
                .then(() => document.getElementById('categoryNameInput').value = '')
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
                        w-1/4
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
                        border-green-500
                        border-t-2
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

    const displayItems = categoryId => dataItems ?
        dataItems.filter(({category_id}) => (category_id === categoryId)).map(({ item_name: itemName, item_id: itemId, item_price: itemPrice }) => (
            <div
                key={itemId}
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
                        border-green-500
                        border-t-2
                    "
            >
                <span>
                    {itemName} - {itemPrice / 100}€
                </span>
                <span className="float-right cursor-pointer" onClick={() => handleOnClickItemCross(itemId)}>
                    X
                </span>
            </div>
        ))
        : null;

    const displayCategories = dataCategories ?
        dataCategories.map(({category_id: categoryId, category_name: categoryName}) => (
            <div key={categoryId}>
                <div className="border-2 ml-auto mr-auto" style={{width: '95%'}}/>
                <div className="flex justify-center">
                    <div className="flex justify-center mt-5 mb-5 py-1 border-b-2 border-gray-600 w-56">
                        {categoryName}
                    </div>
                    <div className="mt-5 mb-5 py-1 border-b-2 border-gray-600">
                        <div className="cursor-pointer transform hover:translate-y-1 duration-100 hover:scale-150" onClick={() => handleOnClickCategoryCross(categoryId)}>X</div>
                    </div>
                </div>
                <div className="flex justify-center mt-10 mb-10">
                    <form id="formItem" className="w-1/5 mr-56" onSubmit={e => {e.preventDefault(); e.stopPropagation();handleSubmitFormItem(categoryId);}}>
                        <div className="flex items-center border-b border-gray-700 py-2">
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-900 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="text" placeholder={`Nom ${categoryName}`} aria-label="item name" id={`${categoryId}NameInput`} required/>
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-900 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="number" placeholder={`Prix ${categoryName}`} aria-label="item price" id={`${categoryId}PriceInput`} required/>
                            <button
                                className="flex-shrink-0 bg-gray-700 hover:bg-gray-900 border-gray-700 hover:border-gray-900 text-sm border-4 text-white py-1 px-2 rounded"
                                type="submit">
                                Ajouter
                            </button>
                        </div>
                    </form>
                    <div className="w-1/2">
                        {displayItems(categoryId)}
                    </div>
                </div>
            </div>
        ))
    : (
        loadingCategories ? <span>Loading</span> : <span>error</span>
    );

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
                        <div className="flex items-center border-b border-gray-700 py-2">
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-900 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="text" placeholder="Ajouter une table" aria-label="Table name" id="tableNameInput" required/>
                            <button
                                className="flex-shrink-0 bg-gray-700 hover:bg-gray-900 border-gray-700 hover:border-gray-900 text-sm border-4 text-white py-1 px-2 rounded"
                                type="submit">
                                Ajouter
                            </button>
                        </div>
                    </form>
                    <div className="w-1/2">
                        {displayTables}
                    </div>
                </div>
                {displayCategories}
                <div className="border-2 ml-auto mr-auto" style={{width: '95%'}}/>
                <div className="flex justify-center mt-10 mb-10">
                    <form id="formCategory" className="w-1/2" id="formCategory" onSubmit={e => {e.preventDefault(); e.stopPropagation(); handleSubmitFormCategory();}}>
                        <div className="flex items-center border-b border-gray-700 py-2">
                            <input
                                className="appearance-none bg-transparent border-none w-full text-gray-900 mr-1 py-1 px-1 leading-tight focus:outline-none"
                                type="text" placeholder="Ajouter une catégorie" aria-label="Category name" id="categoryNameInput" required/>
                            <button
                                className="flex-shrink-0 bg-gray-700 hover:bg-gray-900 border-gray-700 hover:border-gray-900 text-sm border-4 text-white py-1 px-2 rounded"
                                type="submit">
                                Ajouter
                            </button>
                        </div>
                    </form>
                </div>
            </>;
}
