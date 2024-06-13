import { useEffect, useState } from "react";
import DecimalFormat from 'decimal-format';
import abi from './abi.json';
import { getContract, prepareTransaction } from "thirdweb";
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { ethereum, arbitrum } from "thirdweb/chains";
import { toWei } from "thirdweb/utils";
import { getWalletBalance } from "thirdweb/wallets";
import { BigNumber, ethers } from "ethers";
import { client } from "./client";

const ETHEREUM_CONTRACT_ADDRESS: string = "0xd2ce34cc70ffdc707934bd0035fc1b4450936d63";
const ARBITRUM_CONTRACT_ADDRESS: string = "0xa6774B8A0C61e724BDA845b22b0ACB42c4f5c100";
const ETH_ADDRESS: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export function App() {
	const account = useActiveAccount();

	const ethereumContract = getContract({
		address: ETHEREUM_CONTRACT_ADDRESS,
		chain: ethereum,
		abi
	});
	const arbitrumContract = getContract({
		address: ARBITRUM_CONTRACT_ADDRESS,
		chain: arbitrum,
		abi
	});

	const [ethereumContractBalance, setEthereumContractBalance] = useState<string>("0");
	const [arbitrumContractBalance, setArbitrumContractBalance] = useState<string>("0");

	const [ethereumWalletBalance, setEthereumWalletBalance] = useState<string>("0");
	const [arbitrumWalletBalance, setArbitrumWalletBalance] = useState<string>("0");

  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");

  const [exchangeRate, setExchangeRate] = useState(null);

  const [loading, setLoading] = useState<boolean>(false);

  const { mutate, data } = useSendTransaction();

  // to-do: figure out why traderate is returning undefined
  // 
  // const { data: traderate } = useReadContract({
  //   contract: arbitrumContract,
  //   method: "traderate"
  // });

  // to-do: remove hard-coded traderate
  const traderate = "980000000000000000";

	function handleInput(e) {
		setInputValue(e.target.value);
	}

	function handleMax() {
		setInputValue(arbitrumWalletBalance);
	}

	const handleSwap = async e => {
    e.preventDefault();

    if (!arbitrumContract) {
      console.error("Arbitrum contract not loaded");
      return;
    }

    setLoading(true);

    try {
      const amountIn = ethers.utils.parseUnits(inputValue, 18);
      const amountOutMin = ethers.utils.parseUnits(outputValue, 18);
      const inToken = ETH_ADDRESS;
      const outToken = ETH_ADDRESS;
      const functionName = "swapExactTokensForTokens";

      // to-do: submit the transaction

			mutate(tx);

      alert('Transaction successful');
      console.log(tx);
    } catch (err) {
      alert('Error calling exactTokensForTokens');
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
    if (traderate) {
      setExchangeRate(traderate);
    }
  }, [traderate]);

  useEffect(() => {
  	account && fetchAccountBalances();

    setInterval(fetchContractBalances, 60000);
  }, [account]);

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
