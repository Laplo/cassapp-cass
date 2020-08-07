import React, {useEffect, useState} from "react";

import {
    gql,
    useSubscription,
    useMutation, useQuery,
} from '@apollo/client';
import ScrollTrigger from 'react-scroll-trigger';

const QUERY_ORDERS = gql`
  query MyQuery($limit: Int!, $offset: Int!) {
    orders(limit: $limit, offset: $offset, order_by: {order_created_at: desc}) {
      order_id
      comment
      order_created_at
      quantity
      user {
        user_name
      }
      soft {
        soft_name
      }
      alcohol {
        alcohol_name
      }
    }
  }
`;

const SUBSCRIBE_LENGTH_ORDERS = gql`
    subscription MySubscription {
      orders_aggregate {
        aggregate {
          count
        }
      }
    }
`;

const SUBSCRIBE_NEW_ORDERS = gql`
  subscription MySubscription {
    orders(
      order_by: {order_created_at: desc}
      where: {is_notified: {_eq: false}}
    ) {
      quantity
      user {
        user_name
      }
      soft {
        soft_name
      }
      alcohol {
        alcohol_name
      }
      order_id
    }
  }
`;

const UPDATE_NEW_ORDERS = gql`
  mutation MyMutation($order_id: uuid!) {
    update_orders(
      where: {order_id: {_eq: $order_id}}
      _set: {is_notified: true}
    ) {
      affected_rows
    }
  }
`;


export default function Homepage() {
    const [inViewport, setInViewport] = useState(false);
    const {data: dataNewOrders} = useSubscription(SUBSCRIBE_NEW_ORDERS);
    const {data: dataOrders, fetchMore: fetchMoreOrders, subscribeToMore: subscribeToMoreOrders} = useQuery(QUERY_ORDERS, {
        variables: {
            limit: 20,
            offset: 0
        },
        fetchPolicy: "cache-and-network"
    });
    const {data: dataLengthOrders} = useSubscription(SUBSCRIBE_LENGTH_ORDERS);
    const [updateOrder] = useMutation(UPDATE_NEW_ORDERS);
    const [audio] = useState(new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'));

    useEffect(() => {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
        } else {
            Notification.requestPermission().then(r => (
                console.log(r)
            ));
        }
        subscribeToMoreOrders({
            document: SUBSCRIBE_NEW_ORDERS,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data.orders.length) return prev;
                const newOrder = subscriptionData.data.orders;
                console.log(prev.orders.length)
                return Object.assign({}, prev, {
                    orders: [newOrder, ...prev.orders]
                });
            }
        })
    // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (inViewport && dataOrders && dataLengthOrders && dataOrders.orders.length < dataLengthOrders.orders_aggregate.aggregate.count) {
            console.log('lentgh', dataOrders.orders.length);
            console.log('agg', dataLengthOrders.orders_aggregate.aggregate.count);

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
                console.log('fetched more');
            });
        }
    // eslint-disable-next-line
    }, [inViewport]);

    useEffect(() => {
        if (!dataNewOrders || !dataNewOrders.orders.length) return;

        dataNewOrders.orders.forEach(({user, quantity, order_id}) => {
            const n = new Notification(user.user_name + " commande ", {
                icon: 'android-chrome-192x192.png',
                body: quantity,
            });
            updateOrder({variables: {order_id}}).then(() => {
                console.log('updated');
            });
            n.onshow = () => {
                audio.currentTime = 0;
                audio.play();
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
           alcohol,
           comment,
           quantity,
           order_created_at,
           soft,
           order_id,
           user: {
               user_name
           },
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
                                {user_name}
                            </div>
                            <span className="text-gray-500">{transformDate(order_created_at)}</span>
                        </div>
                        <div className="py-4 text-center">
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
                                    m-2
                                    hover:bg-green-500
                                    transform
                                    hover:translate-y-1
                                    hover:text-white
                                    hover:scale-110
                                    transition
                                    duration-200
                                    "
                            >
                                {quantity} {alcohol ? alcohol.alcohol_name : ''} {soft ? soft.soft_name : ''}
                            </span>
                        </div>
                        <div className="text-center text-gray-500 italic text-sm hover:text-green-100">
                            {comment}
                        </div>
                    </div>
                </div>
            </div>
        ))
    : null;

    return (
        <>
            <div className="flex flex-wrap justify-center mt-10 mb-10">
                {displayOrders}
                <ScrollTrigger onEnter={() => setInViewport(true)} onExit={() => setInViewport(false)} />
            </div>
        </>
    )
};
