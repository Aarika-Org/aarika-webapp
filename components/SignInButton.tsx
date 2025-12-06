import React from 'react';
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { avalanche } from "thirdweb/chains";
import { thirdwebClient } from "../lib/thirdweb";

const wallets = [
    inAppWallet({
        auth: {
            options: ["email", "google", "apple"],
        },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("io.rabby"),
    createWallet("me.rainbow"),
];

const SignInButton: React.FC = () => {
    return (
        <ConnectButton
            client={thirdwebClient}
            wallets={wallets}
            chain={avalanche}
            theme="light"
            connectButton={{
                label: "Sign In",
                style: {
                    backgroundColor: "#ff90e8",
                    color: "#000000",
                    border: "2px solid #000000",
                    padding: "10px 20px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    boxShadow: "2px 2px 0px 0px #000000",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontFamily: "inherit",
                },
            }}
            connectModal={{
                title: "Sign in to Aarika",
                size: "wide",
                showThirdwebBranding: false,
            }}
            detailsButton={{
                style: {
                    backgroundColor: "#ff90e8",
                    color: "#000000",
                    border: "2px solid #000000",
                    padding: "10px 16px",
                    fontWeight: "800",
                    boxShadow: "2px 2px 0px 0px #000000",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontFamily: "inherit",
                },
            }}
        />
    );
};

export default SignInButton;
