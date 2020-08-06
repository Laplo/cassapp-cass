import React, {useEffect, useState} from "react";

import {
    gql,
    useSubscription,
    useMutation,
} from '@apollo/client';

const SUBSCRIBE_ORDERS = gql`
  subscription MySubscription {
    orders(limit: 10, order_by: {order_created_at: desc}) {
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
    const {data: dataNewOrders} = useSubscription(SUBSCRIBE_NEW_ORDERS);
    const {data: dataOrders} = useSubscription(SUBSCRIBE_ORDERS);
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


    return dataOrders ?
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
                borderTop: "3px solid green",
                marginLeft: "auto",
                marginRight: "auto",
                left: "50%",
            }}
            key={order_id}
            className="
                max-w-sm
                rounded
                overflow-hidden
                shadow-2xl
                mt-10
            ">
                <div
                    style={{marginLeft: '10%', marginRight: '10%'}}
                >
                    <div className="px-6 py-4">
                        <div className="font-bold text-xl mb-2">
                            {user_name}
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
                    </div>
                </div>
            </div>
        ))
    : null;
};
