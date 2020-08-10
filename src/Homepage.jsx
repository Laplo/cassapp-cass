import React, {useEffect, useState} from "react";

import {
    gql,
    useSubscription,
    useMutation, useQuery,
} from '@apollo/client';
import ScrollTrigger from 'react-scroll-trigger';

const QUERY_ORDERS = gql`
    query MyQuery($barId: uuid!, $limit: Int!, $offset: Int!) {
      orders(where: {table: {bar_id: {_eq: $barId}}}, limit: $limit, offset: $offset, order_by: {order_created_at: desc}) {
        table {
          table_name
        }
        order_lines {
          comment
          drink {
            drink_name
          }
          quantity
          order_line_id
        }
        order_created_at
        order_id
      }
    }
`;

const SUBSCRIBE_LENGTH_ORDERS = gql`
    subscription MySubscription($barId: uuid!) {
      orders_aggregate(where: {table: {bar_id: {_eq: $barId}}}) {
        aggregate {
          count
        }
      }
    }
`;

const SUBSCRIBE_NEW_ORDERS = gql`
  subscription MySubscription($barId: uuid!) {
    orders(where: {table: {bar_id: {_eq: $barId}}, order_is_notified: {_eq: false}}, order_by: {order_created_at: desc}) {
        table {
          table_name
        }
        order_lines {
          comment
          drink {
            drink_name
          }
          quantity
          order_line_id
        }
        order_created_at
        order_id
    }
  }
`;

const UPDATE_NEW_ORDERS = gql`
  mutation MyMutation($order_id: uuid!) {
    update_orders(
      where: {order_id: {_eq: $order_id}}
      _set: {order_is_notified: true}
    ) {
      affected_rows
    }
  }
`;


export default function Homepage({ barId }) {
    const [inViewport, setInViewport] = useState(false);
    const {data: dataNewOrders} = useSubscription(SUBSCRIBE_NEW_ORDERS, { variables: { barId }});
    const {loading: loadingOrders, data: dataOrders, fetchMore: fetchMoreOrders, subscribeToMore: subscribeToMoreOrders} = useQuery(QUERY_ORDERS, {
        variables: {
            limit: 20,
            offset: 0,
            barId
        },
        fetchPolicy: "cache-and-network"
    });
    const [loading, setLoading] = useState(loadingOrders);
    const {data: dataLengthOrders} = useSubscription(SUBSCRIBE_LENGTH_ORDERS, { variables : { barId }});
    const [updateOrder] = useMutation(UPDATE_NEW_ORDERS);
    const [audio] = useState(new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'));

    useEffect(() => {
        audio.muted = true;
        subscribeToMoreOrders({
            document: SUBSCRIBE_NEW_ORDERS,
            variables: {
                barId
            },
            updateQuery: (prev, {subscriptionData}) => {
                if (!subscriptionData.data.orders.length) return prev;
                const newOrder = subscriptionData.data.orders;
                return Object.assign({}, prev, {
                    orders: [newOrder, ...prev.orders]
                });
            }
        });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        setLoading(loadingOrders);
    }, [loadingOrders]);

    useEffect(() => {
        if (inViewport && dataOrders && dataLengthOrders && dataOrders.orders.length < dataLengthOrders.orders_aggregate.aggregate.count) {
            setLoading(true);
            fetchMoreOrders({
                variables: {
                    offset: dataOrders.orders.length
                },
                updateQuery: (prev, {fetchMoreResult}) => {
                    if (!fetchMoreResult) return prev;
                    return Object.assign({}, prev, {
                        orders: [...prev.orders, ...fetchMoreResult.orders]
                    });
                }
            }).then(() => {
                setLoading(false);
            });
        }
        // eslint-disable-next-line
    }, [inViewport]);

    useEffect(() => {
        if (!dataNewOrders || !dataNewOrders.orders.length) return;

        dataNewOrders.orders.forEach(({table, quantity, order_id}) => {
            const n = new Notification(table.table_name + " commande ", {
                icon: 'android-chrome-192x192.png',
                body: quantity,
            });
            updateOrder({variables: {order_id}}).then(r => r);
            n.onshow = () => {
                audio.currentTime = 0;
                audio.play().then(r => r);
                setTimeout(() => audio.pause(), 6000);
            };
            n.onclose = () => audio.pause();
        });
    }, [dataNewOrders, updateOrder, audio]);

    const transformDate = date => {
        const addZBefore = date => date < 10 ? '0' + date : date;
        const nDate = new Date(date);
        const day = addZBefore(nDate.getDate());
        const month = addZBefore(nDate.getMonth() + 1);
        const year = nDate.getFullYear();
        const hour = addZBefore(nDate.getHours());
        const minute = addZBefore(nDate.getMinutes());

        return 'Le ' + day + '/' + month + '/' + year + ' à ' + hour + ':' + minute;
    };

    const displayOrders = dataOrders ?
        dataOrders.orders.map(({
            order_created_at,
            order_id,
            table: {
                table_name
            },
            order_lines
        }) => (
            <div style={{
                borderTop: "3px solid #48bb78",
                width: "30%",
                minWidth: "300px"
            }}
                key={order_id}
                className="
                    rounded-t-lg
                    rounded-b-sm
                    overflow-hidden
                    shadow-xl
                    m-5
                    bg-gray-700
                    flex-none
                    hover:bg-gray-900
                    transform
                    hover:translate-y-1
                    hover:scale-105
                    hover:shadow-2xl
                    transition
                    duration-500
            ">
                <div className="mr-5 ml-5">
                    <div className="px-6 py-4">
                        <div className="mb-0">
                            <div className="font-bold text-xl text-gray-300">
                                {table_name}
                            </div>
                            <span className="text-gray-500">{transformDate(order_created_at)}</span>
                        </div>
                        {order_lines.map(({order_line_id, drink: {drink_name}, comment, quantity}) => (
                            <div key={order_line_id} className="mt-1 py-1 text-center">
                                <span
                                    className="
                                        inline-block
                                        bg-gray-200
                                        rounded-full
                                        px-3
                                        py-1
                                        text-sm
                                        font-semibold
                                        text-gray-700
                                        hover:bg-green-500
                                        transform
                                        hover:translate-y-1
                                        hover:text-white
                                        hover:scale-110
                                        transition
                                        duration-200
                                    "
                                >
                                    {quantity} {drink_name}
                                </span>
                                {comment ?
                                    <span className="text-center text-gray-500 italic text-sm hover:text-green-100">
                                        &nbsp; - {comment}
                                    </span>
                                    : null
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))
        : null;

    return (
        <>
            <div className="flex flex-wrap justify-center mt-10 mb-10">
                {displayOrders}
                <ScrollTrigger onEnter={() => setInViewport(true)} onExit={() => setInViewport(false)}/>
            </div>
            {loading ?
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
                        Chargement des données supplémentaires...
                    </div>
                </div>
                : null}
        </>
    )
};
