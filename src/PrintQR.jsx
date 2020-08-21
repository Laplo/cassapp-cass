import React, {useEffect, useState} from "react";

import {useParams} from "react-router-dom";
import QRCode from "qrcode.react";


export default function PrintQR() {

    const {tableId} = useParams();

    useEffect(() => {
        if(tableId !== 'dashboard') setTimeout(() => window.print());
    });

    return tableId !== 'dashboard' ?
            <div className="mt-16 absolute inset-0 flex items-center justify-center">
                <QRCode
                    id={tableId}
                    value={tableId}
                    size={256}
                />
            </div>
        : null;
}
