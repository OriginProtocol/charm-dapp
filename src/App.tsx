import { useEffect, useState } from "react";
import DecimalFormat from 'decimal-format';
import abi from './abi.json';
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { ConnectButton, useActiveAccount, useActiveWalletChain, useSendTransaction, useSwitchActiveWalletChain } from "thirdweb/react";
import { ethereum, arbitrum, mainnet } from "thirdweb/chains";
import { getWalletBalance } from "thirdweb/wallets";
import { BigNumber, ethers } from "ethers";
import { client } from "./client";
import { getTradeRate } from "./utils";
import { ARBITRUM_CONTRACT_ADDRESS, ETHEREUM_CONTRACT_ADDRESS, ETH_ADDRESS } from "./constants";

export function App() {
	const account = useActiveAccount();

	const [ethereumContractBalance, setEthereumContractBalance] = useState<string>("0");
	const [arbitrumContractBalance, setArbitrumContractBalance] = useState<string>("0");
	const [tradeRate, setTradeRate] = useState<any>(null);

	const [ethereumWalletBalance, setEthereumWalletBalance] = useState<string>("0");
	const [arbitrumWalletBalance, setArbitrumWalletBalance] = useState<string>("0");
    const [pendingEthClaims, setPendingEthClaims] = useState<number>(0);
    const [pendingArbClaims, setPendingArbClaims] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");

  const [exchangeRate, setExchangeRate] = useState(null);

  const [loading, setLoading] = useState<boolean>(false);
  const switchChain = useSwitchActiveWalletChain();

	function handleInput(e) {
		setInputValue(e.target.value);
	}

	function handleMax() {
		setInputValue(arbitrumWalletBalance);
	}

	const handleSwap = async e => {
    e.preventDefault();

    setLoading(true);

    try {
      const amountIn = ethers.utils.parseUnits(inputValue, 18);
      const amountOutMin = ethers.utils.parseUnits(outputValue, 18);
      const inToken = ETH_ADDRESS;
      const outToken = ETH_ADDRESS;
	  const network = await provider.getNetwork();
      const contractAddress=network.chainId == 1 ? ETHEREUM_CONTRACT_ADDRESS : ARBITRUM_CONTRACT_ADDRESS;
	  const chain=network.chainId == 1 ? mainnet : arbitrum;
	  const contract = getContract({
		client,
		address: contractAddress,
		chain,
		abi
	});
	  const transaction = prepareContractCall({
		  contract,
		  method: "function swapExactTokensForTokens(address inToken, address outToken, uint256 amountIn, uint256 amountOutMin, address to)",
		  params: [inToken, outToken, amountIn, amountOutMin, account?.address],
		  value: amountIn
	  });
	  const { transactionHash } = await sendTransaction({
		account,
		transaction,
	  });
      // to-do: submit the transaction

	  //mutate(tx);

      alert('Transaction sent : ' + transactionHash);
    } catch (err) {
     // alert('Error calling swap');
      console.error(err);
    } finally {
      setLoading(false);
    }
	};

  const fetchAccountBalances = async () => {
    try {
    	let balance;

			balance = await getWalletBalance({
			  address: account.address,
			  chain: ethereum,
			  client
			});

      setEthereumWalletBalance(balance?.displayValue || "0");

			balance = await getWalletBalance({
			  address: account.address,
			  chain: arbitrum,
			  client
			});

      setArbitrumWalletBalance(balance?.displayValue || "0");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContractBalances = async () => {
    try {
    	let balance;

			balance = await getWalletBalance({
			  address: ETHEREUM_CONTRACT_ADDRESS,
			  chain: ethereum,
			  client
			});

      setEthereumContractBalance(balance?.displayValue || "0");

			balance = await getWalletBalance({
			  address: ARBITRUM_CONTRACT_ADDRESS,
			  chain: arbitrum,
			  client
			});

      setArbitrumContractBalance(balance?.displayValue || "0");
    } catch (err) {
      console.error(err);
    }
  };

  fetchContractBalances();


  useEffect(() => {
  	account && fetchAccountBalances();

    setInterval(fetchContractBalances, 60000);
  }, [account]);

  useEffect(() => {
    const fetchTradeRate = async () => {
      try {
        const rate = await getTradeRate();
        setTradeRate(rate);
		setExchangeRate(rate);
        console.log("Data:", rate);
      } catch (error) {
        console.error("Failed to fetch trade rate:", error);
      }
    };

    fetchTradeRate();
  }, [tradeRate]);

  useEffect(() => {
  	if (inputValue && exchangeRate) {
  		const bigInputValue = ethers.utils.parseUnits(inputValue, 18);
  		const bigOutputValue = bigInputValue.mul(exchangeRate).div(BigNumber.from(10).pow(18));
  		const formattedOutputValue = ethers.utils.formatUnits(bigOutputValue, 18);

  		setOutputValue(formattedOutputValue);
  	} else {
  		setOutputValue('');
  	}
  }, [inputValue, exchangeRate]);

  const handleNetworkChange = async (newNetwork: ethers.providers.Network) => {
	console.log("Network switched to:", newNetwork.chainId);
	
  };


  // Set up event listener for network changes
//   provider.on("network", (newNetwork, oldNetwork) => {
// 	if (oldNetwork) {
// 	  handleNetworkChange(newNetwork);
// 	}
//   });


  useEffect(() => {
	fetchPendingClaims();
}, []);

const fetchPendingClaims = async () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);
	const network = await provider.getNetwork();
	const contractAddress = network.chainId === 1 ? ETHEREUM_CONTRACT_ADDRESS : ARBITRUM_CONTRACT_ADDRESS;
	const contract = new ethers.Contract(contractAddress, abi, provider);

	try {
		const ethClaims = await contract.pendingUserBalance(account?.address);
		const arbClaims = await contract.pendingUserBalance(account?.address);
		setPendingEthClaims(ethClaims.toNumber());
		setPendingArbClaims(arbClaims.toNumber());
	} catch (error) {
		console.error("Error fetching pending claims:", error);
	}
};
const handleClaim = async () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);
  	const network = await provider.getNetwork();
	const contractAddress=network.chainId == 1 ? ETHEREUM_CONTRACT_ADDRESS : ARBITRUM_CONTRACT_ADDRESS;
	const chain=network.chainId == 1 ? mainnet : arbitrum;
	const contract = getContract({
	  client,
	  address: contractAddress,
	  chain,
	  abi
  });

	try {
		const transaction = prepareContractCall({
			contract,
			method: "function claimPendingBalance()",
			params: [],
		});
		const { transactionHash } = await sendTransaction({
		  account,
		  transaction,
		});
		fetchPendingClaims();
		alert("Transaction sent: " + transactionHash);
	} catch (error) {
		console.error("Error claiming tokens:", error);
	}
};

  const df = new DecimalFormat('#,##0.000');

	return (
		<main className="p-4 container max-w-screen-lg mx-auto">
			<Navbar />
			<div className="py-20">
				<div className="flex justify-center mb-10 flex-col">
				  <form className="rounded px-8 pt-6 pb-8 mb-4 mx-auto" onSubmit={handleSwap}>
				    <div className="mb-4 input-container px-4 flex items-center">
				      <input
				        type="number"
				        placeholder="0"
				        value={inputValue}
				        onChange={handleInput}
				        fontFamily="monospace"
				        className="appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none"
				      />
				      <div className="max-container w-12 mr-2">
				      	{arbitrumWalletBalance !== '0' && arbitrumWalletBalance !== inputValue &&
				      		<a className="max text-yellow-400" onClick={handleMax}>Max</a>
				      	}
				      </div>
				      <img src="https://efa358f60d03e391c09a04028291ee65.ipfscdn.io/ipfs/QmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9/arbitrum/512.png" />
				      <div className="symbol pl-2">ETH</div>
				    </div>
				    <div className="mb-6 input-container px-4 flex items-center">
				      <input
				      	disabled
				        type="number"
				        placeholder="0"
				        value={outputValue}
				        fontFamily="monospace"
				        className="appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none"
				      />
				      <img src="https://efa358f60d03e391c09a04028291ee65.ipfscdn.io/ipfs/QmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9/ethereum/512.png" />
				      <div className="symbol pl-2">ETH</div>
				    </div>
			      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-4 rounded focus:outline-none w-full" type="submit">
			        Swap
			      </button>
				  </form>
					<div className="contracts flex justify-center mb-20 px-8 mx-auto">
				  	<div className="card p-4 mr-2 flex-grow text-center">
				  		<h3>Ethereum liquidity</h3>
				  		<p><strong>{df.format(ethereumContractBalance)} ETH</strong></p>
				  	</div>
				  	<div className="card p-4 flex-grow text-center">
				  		<h3>Arbitrum liquidity</h3>
				  		<p><strong>{df.format(arbitrumContractBalance)} ETH</strong></p>
				  	</div>
				  </div>
				  <div>
                    <h2>Pending Claims</h2>
                    <div>
                        <h3>ETH</h3>
                        {pendingEthClaims > 0 ? (
                            <button onClick={async () => {
								let provider = new ethers.providers.Web3Provider(window.ethereum);
								const network = await provider.getNetwork();
								if(network.chainId!=1) switchChain(mainnet)
								handleClaim()
							}}>Claim {pendingEthClaims} ETH</button>
                        ) : (
                            <p>No pending claims for ETH on Mainnet</p>
                        )}
                    </div>
                    <div>
                        <h3>ARB</h3>
						{pendingArbClaims > 0 ? (
                            <button onClick={async () => {
								let provider = new ethers.providers.Web3Provider(window.ethereum);
								const network = await provider.getNetwork();
								if(network.chainId!=42161) switchChain(arbitrum)
								handleClaim()
							}}>Claim {pendingArbClaims} ETH</button>
                        ) : (
                            <p>No pending claims for ETH on Arbitrum</p>
                        )}
                    </div>
                </div>
			  </div>
			</div>
		</main>
	);
}

function Navbar() {
	return (
		<nav className="flex justify-between">
			<div id="logo"><span className="translucent">CH</span>ARM<span className="sparkle">✨</span></div>
			<ConnectButton
				client={client}
				chains={[ethereum, arbitrum]}
				appMetadata={{
					name: "Charm",
					url: "https://ipfs.io",
				}}
			/> 
		</nav>
	);
}
