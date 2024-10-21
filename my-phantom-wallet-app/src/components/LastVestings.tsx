import { getExplorerLink } from "@/utils/getExplorerLink";
import { TOKEN_VESTING_PROGRAM_ID } from "@/vesting_program/instructions";
import { ContractInfo } from "@/vesting_program/state";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

interface Contract { info: ContractInfo; vestingAccount: PublicKey; }

export default function LastVestings() {
  const { connection } = useConnection();
  const [vestingContracts, setVestingContracts] = useState<Contract[]>([]);

  useEffect(() => {
    async function getLastVestings() {
      const accounts = await connection.getProgramAccounts(TOKEN_VESTING_PROGRAM_ID, { dataSlice: { offset: 0, length: 0 } })
      const pubKeys = accounts.map(({ pubkey }) => pubkey);
      const contracts: Contract[] = [];
      const informations = await connection.getMultipleAccountsInfo(pubKeys);
      informations.forEach((info, i) => {
        if (info) {
          const contractInfo = ContractInfo.fromBuffer(info.data);
          if (contractInfo) {
            contracts.push({ info: contractInfo, vestingAccount: pubKeys[i] });
          }
        }
      });
      contracts.sort((a, b) => a.info.creationTime - b.info.creationTime);
      setVestingContracts(contracts);
    }

    getLastVestings();

  }, [connection])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6">
      <ul className="flex items-baseline gap-10">
        {vestingContracts.map((contract) => (
          <li
            key={contract.vestingAccount.toBase58()}
            className="card bg-white max-w-sm p-8 rounded overflow-hidden shadow-lg text-black"
          >
            <div className="flex justify-start gap-2">
              <span className="font-bold">Contract</span>
              <span className="">
                <a
                  href={getExplorerLink("address", contract.vestingAccount.toBase58(), "devnet")}
                  target="_blank"
                >
                  {contract.vestingAccount.toBase58().slice(0, 7)}
                </a>
              </span>
            </div>
            <div className="flex justify-start gap-2">
              <span className="font-bold">Token</span>
              <span className="">
                <a
                  href={getExplorerLink("address", contract.info.mintAddress.toBase58(), "devnet")}
                  target="_blank"
                >
                  {contract.info.mintAddress.toBase58().slice(0, 7)}
                </a>
              </span>
            </div>
            <div className="flex justify-start gap-2">
              <span className="font-bold">Destiny</span>
              <span className="">
                <a
                  href={getExplorerLink("address", contract.info.destinationAddress.toBase58(), "devnet")}
                  target="_blank"
                >
                  {contract.info.destinationAddress.toBase58().slice(0, 7)}
                </a>
              </span>
            </div>
            <div className="flex justify-start gap-2">
              <span className="font-bold">Created at</span>
              <span>
                {new Date(contract.info.creationTime * 1000).toLocaleString("pt-br")}
              </span>
            </div>
            <h4 className="font-extrabold text-center mt-2">Schedules</h4>
            <ul>
              {contract.info.schedules.map((schedule, index) => (
                <li className="card bg-white rounded overflow-hidden shadow-lg text-black p-2" key={schedule.releaseTime.toString()}>
                  <h5 className="text-center font-bold">#{index + 1}</h5>
                  <div className="flex justify-start gap-1">
                    <span className="font-bold">
                      Release
                    </span>
                    <span>
                      {new Date(schedule.releaseTime.toNumber() * 1000).toLocaleString("pt-br")}
                    </span>
                  </div>
                  <div className="flex justify-start gap-2">
                    <span className="font-bold">
                      Amount      
                    </span>
                    <span>
                      {schedule.amount.toNumber()}
                    </span>                    
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
