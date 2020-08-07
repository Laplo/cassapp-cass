import React, {useEffect, useState} from "react";

import {
    gql,
    useSubscription,
    useMutation,
} from '@apollo/client';
import ScrollTrigger from 'react-scroll-trigger';

const SUBSCRIBE_ORDERS = gql`
  subscription MySubscription($limit: Int!) {
    orders(limit: $limit, order_by: {order_created_at: desc}) {
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
    const [limit, setLimit] = useState(20);
    const {data: dataNewOrders} = useSubscription(SUBSCRIBE_NEW_ORDERS);
    const {data: dataOrders} = useSubscription(SUBSCRIBE_ORDERS, {variables: {limit}});
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
    }, []);

    useEffect(() => {
        if (inViewport) {
            setLimit(l => l + 20);
        }
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
                minWidth: "20%"
            }}
            key={order_id}
            className="
                rounded-t-lg
                rounded-b-sm
                overflow-hidden
                shadow-2xl
                m-5
                bg-gray-700
                hover:bg-gray-600
            ">
                <div className="mr-5 ml-5">
                    <div className="px-6 py-4">
                        <div className="mb-0">
                            <div className="font-bold text-xl text-gray-300">
                                {user_name}
                            </div>
                            <span className="text-gray-500">{transformDate(order_created_at)}</span>
                        </div>
                        <div className="py-4">
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
                                    mr-2"
                            >
                                {quantity}
                            </span>
                            {alcohol ?
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
                                        mr-2"
                                >
                                    {alcohol.alcohol_name}
                                </span>
                            : null}
                            {soft ?
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
                                        mr-2"
                                >
                                   {soft.soft_name}
                                </span>
                            : null}
                        </div>
                        <div className="text-center text-gray-500 italic text-sm max-w-xs">
                            {comment}
                        </div>
                    </div>
                </div>
            </div>
        ))
    : null;

    return (
        <>
            <div className="flex content-between flex-wrap justify-center">
                {displayOrders}
                <ScrollTrigger onEnter={() => setInViewport(true)} onExit={() => setInViewport(false)} />
            </div>
        </>
    )
};
