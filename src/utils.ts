import { ethers } from 'ethers';
import abi from './abi.json';
import { ARBITRUM_CONTRACT_ADDRESS, ETHEREUM_CONTRACT_ADDRESS } from "./constants";

export async function getTradeRate(): Promise<any> {
    try {
      const PROVIDER = new ethers.providers.Web3Provider(window.ethereum);
      const network = await PROVIDER.getNetwork();
      const contractAddress=network.chainId == 1 ? ETHEREUM_CONTRACT_ADDRESS : ARBITRUM_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(contractAddress,abi, PROVIDER);
      const tradeRate = await contract.traderate();
      return tradeRate.toString();
    } catch (error) {
      console.error("Error fetching trade rate:", error);
      throw error;
    }
  }