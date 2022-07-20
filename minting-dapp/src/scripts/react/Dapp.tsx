import React from 'react'
import { ethers, BigNumber } from 'ethers'
import { ExternalProvider, Web3Provider } from '@ethersproject/providers'
import detectEthereumProvider from '@metamask/detect-provider'
import NftContractType from '../lib/NftContractType'
import CollectionConfig from '../../../../smart-contract/config/CollectionConfig'
import NetworkConfigInterface from '../../../../smart-contract/lib/NetworkConfigInterface'
import CollectionStatus from './CollectionStatus'
import MintWidget from './MintWidget'
import Whitelist from '../lib/Whitelist'
import { toast } from 'react-toastify'

const ContractAbi = require('../../../../smart-contract/artifacts/contracts/' +
  CollectionConfig.contractName +
  '.sol/' +
  CollectionConfig.contractName +
  '.json').abi

interface Props {}

interface State {
  userAddress: string | null
  network: ethers.providers.Network | null
  networkConfig: NetworkConfigInterface
  totalSupply: number
  maxSupply: number
  maxMintAmountPerTx: number
  tokenPrice: BigNumber
  isPaused: boolean
  loading: boolean
  isWhitelistMintEnabled: boolean
  isUserInWhitelist: boolean
  merkleProofManualAddress: string
  merkleProofManualAddressFeedbackMessage: string | JSX.Element | null
  errorMessage: string | JSX.Element | null
}

const defaultState: State = {
  userAddress: null,
  network: null,
  networkConfig: CollectionConfig.mainnet,
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx: 0,
  tokenPrice: BigNumber.from(0),
  isPaused: true,
  loading: false,
  isWhitelistMintEnabled: false,
  isUserInWhitelist: false,
  merkleProofManualAddress: '',
  merkleProofManualAddressFeedbackMessage: null,
  errorMessage: null,
}

export default class Dapp extends React.Component<Props, State> {
  provider!: Web3Provider

  contract!: NftContractType

  private merkleProofManualAddressInput!: HTMLInputElement

  constructor(props: Props) {
    super(props)

    this.state = defaultState
  }

  componentDidMount = async () => {
    const browserProvider = (await detectEthereumProvider()) as ExternalProvider

    if (browserProvider?.isMetaMask !== true) {
      this.setError(
        <>
          We were not able to detect <strong>MetaMask</strong>. We value{' '}
          <strong>privacy and security</strong> a lot so we limit the wallet
          options on the DAPP.
          <br />
          <br />
          But don't worry! <span className="emoji">😃</span> You can always
          interact with the smart-contract through{' '}
          <a href={this.generateContractUrl()} target="_blank">
            {this.state.networkConfig.blockExplorer.name}
          </a>{' '}
          and{' '}
          <strong>
            we do our best to provide you with the best user experience possible
          </strong>
          , even from there.
          <br />
          <br />
          You can also get your <strong>Whitelist Proof</strong> manually, using
          the tool below.
        </>
      )
    }

    this.provider = new ethers.providers.Web3Provider(browserProvider)

    this.registerWalletEvents(browserProvider)

    await this.initWallet()
  }

  async mintTokens(amount: number): Promise<void> {
    try {
      this.setState({ loading: true })
      const transaction = await this.contract.mint(amount, {
        value: this.state.tokenPrice.mul(amount),
      })

      toast.info(
        <>
          Transaction sent! Please wait...
          <br />
          <a
            href={this.generateTransactionUrl(transaction.hash)}
            target="_blank"
            rel="noopener"
          >
            View on {this.state.networkConfig.blockExplorer.name}
          </a>
        </>
      )

      const receipt = await transaction.wait()

      toast.success(
        <>
          Success!
          <br />
          <a
            href={this.generateTransactionUrl(receipt.transactionHash)}
            target="_blank"
            rel="noopener"
          >
            View on {this.state.networkConfig.blockExplorer.name}
          </a>
        </>
      )

      this.refreshContractState()
      this.setState({ loading: false })
    } catch (e) {
      this.setError(e)
      this.setState({ loading: false })
    }
  }

  async whitelistMintTokens(amount: number): Promise<void> {
    try {
      this.setState({ loading: true })
      const transaction = await this.contract.whitelistMint(
        amount,
        Whitelist.getProofForAddress(this.state.userAddress!),
        { value: this.state.tokenPrice.mul(amount) }
      )

      toast.info(
        <>
          Transaction sent! Please wait...
          <br />
          <a
            href={this.generateTransactionUrl(transaction.hash)}
            target="_blank"
            rel="noopener"
          >
            View on {this.state.networkConfig.blockExplorer.name}
          </a>
        </>
      )

      const receipt = await transaction.wait()

      toast.success(
        <>
          Success!
          <br />
          <a
            href={this.generateTransactionUrl(receipt.transactionHash)}
            target="_blank"
            rel="noopener"
          >
            View on {this.state.networkConfig.blockExplorer.name}
          </a>
        </>
      )

      this.refreshContractState()
      this.setState({ loading: false })
    } catch (e) {
      this.setError(e)
      this.setState({ loading: false })
    }
  }

  private isWalletConnected(): boolean {
    return this.state.userAddress !== null
  }

  private isContractReady(): boolean {
    return this.contract !== undefined
  }

  private isSoldOut(): boolean {
    return (
      this.state.maxSupply !== 0 &&
      this.state.totalSupply >= this.state.maxSupply
    )
  }

  private isNotMainnet(): boolean {
    return (
      this.state.network !== null &&
      this.state.network.chainId !== CollectionConfig.mainnet.chainId
    )
  }

  render() {
    return (
      <div className="flex flex-col mt-6 mx-auto w-full max-w-md shadow-md bg-blue-300 rounded-xl">
        <div className="preview">
          <img src="/build/images/preview.png" alt="Collection preview" />
        </div>

        <div className="px-8 pb-8">
          {this.isNotMainnet() ? (
            <div className="not-mainnet">
              You are not connected to the main network.
              <span className="small">
                Current network: <strong>{this.state.network?.name}</strong>
              </span>
            </div>
          ) : null}

          {this.state.errorMessage ? (
            <div className="error">
              <p>{this.state.errorMessage}</p>
              <button onClick={() => this.setError()}>Close</button>
            </div>
          ) : null}
        </div>

        {this.isWalletConnected() ? (
          <>
            {this.isContractReady() ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <button className="success rounded-xl px-12 pointer-events-none py-2">
                    connected
                  </button>
                </div>

                {!this.isSoldOut() ? (
                  <MintWidget
                    networkConfig={this.state.networkConfig}
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    tokenPrice={this.state.tokenPrice}
                    maxMintAmountPerTx={this.state.maxMintAmountPerTx}
                    isPaused={this.state.isPaused}
                    isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                    isUserInWhitelist={this.state.isUserInWhitelist}
                    mintTokens={mintAmount => this.mintTokens(mintAmount)}
                    whitelistMintTokens={mintAmount =>
                      this.whitelistMintTokens(mintAmount)
                    }
                    errorMessage={this.state.errorMessage}
                    loading={this.state.loading}
                  />
                ) : (
                  <div className="collection-sold-out">
                    <h2>
                      Tokens have been <strong>sold out</strong>!
                      <span className="emoji">🥳</span>
                    </h2>
                  </div>
                )}
              </>
            ) : (
              <div className="collection-not-ready">
                <svg
                  className="spinner"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading collection data...
              </div>
            )}
          </>
        ) : (
          <div className="no-wallet space-y-6">
            <div className="text-white text-center">
              Ready to adopt your <b>cheeky chook</b>?
            </div>

            <div className="flex items-center justify-center flex-col space-y-4">
              <button
                className="primary rounded-xl px-12 py-2"
                disabled={this.provider === undefined}
                onClick={() => this.connectWallet()}
              >
                connect wallet
              </button>
              <div className="text-white text-center font-bold">
                Remember to use the urls in our official channels
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="rounded-xl bg-sky-400 px-4 py-2 text-white text-center text-sm">
                <div className="font-thin">Sale Status</div>
                <div>Whitelist only</div>
              </div>
            </div>
            {/* <CollectionStatus
                  userAddress={this.state.userAddress}
                  maxSupply={this.state.maxSupply}
                  totalSupply={this.state.totalSupply}
                  isPaused={this.state.isPaused}
                  isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                  isUserInWhitelist={this.state.isUserInWhitelist}
                  isSoldOut={this.isSoldOut()}
                /> */}
          </div>
        )}
      </div>
    )
  }

  private setError(error: any = null): void {
    let errorMessage = 'Unknown error...'

    if (null === error || typeof error === 'string') {
      errorMessage = error
    } else if (typeof error === 'object') {
      // Support any type of error from the Web3 Provider...
      if (error?.error?.message !== undefined) {
        errorMessage = error.error.message
      } else if (error?.data?.message !== undefined) {
        errorMessage = error.data.message
      } else if (error?.message !== undefined) {
        errorMessage = error.message
      } else if (React.isValidElement(error)) {
        this.setState({ errorMessage: error })

        return
      }
    }

    this.setState({
      errorMessage:
        null === errorMessage
          ? null
          : errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
    })
  }

  private generateContractUrl(): string {
    return this.state.networkConfig.blockExplorer.generateContractUrl(
      CollectionConfig.contractAddress!
    )
  }

  private generateMarketplaceUrl(): string {
    return CollectionConfig.marketplaceConfig.generateCollectionUrl(
      CollectionConfig.marketplaceIdentifier,
      !this.isNotMainnet()
    )
  }

  private generateTransactionUrl(transactionHash: string): string {
    return this.state.networkConfig.blockExplorer.generateTransactionUrl(
      transactionHash
    )
  }

  private async connectWallet(): Promise<void> {
    try {
      await this.provider.provider.request!({ method: 'eth_requestAccounts' })

      this.initWallet()
    } catch (e) {
      this.setError(e)
    }
  }

  private async refreshContractState(): Promise<void> {
    this.setState({
      maxSupply: (await this.contract.maxSupply()).toNumber(),
      totalSupply: (await this.contract.totalSupply()).toNumber(),
      maxMintAmountPerTx: (await this.contract.maxMintAmountPerTx()).toNumber(),
      tokenPrice: await this.contract.cost(),
      isPaused: await this.contract.paused(),
      isWhitelistMintEnabled: await this.contract.whitelistMintEnabled(),
      isUserInWhitelist: Whitelist.contains(this.state.userAddress ?? ''),
    })
  }

  private async initWallet(): Promise<void> {
    const walletAccounts = await this.provider.listAccounts()

    this.setState(defaultState)

    if (walletAccounts.length === 0) {
      return
    }

    const network = await this.provider.getNetwork()
    let networkConfig: NetworkConfigInterface

    if (network.chainId === CollectionConfig.mainnet.chainId) {
      networkConfig = CollectionConfig.mainnet
    } else if (network.chainId === CollectionConfig.testnet.chainId) {
      networkConfig = CollectionConfig.testnet
    } else {
      this.setError('Unsupported network!')

      return
    }

    this.setState({
      userAddress: walletAccounts[0],
      network,
      networkConfig,
    })

    if (
      (await this.provider.getCode(CollectionConfig.contractAddress!)) === '0x'
    ) {
      this.setError(
        'Could not find the contract, are you connected to the right chain?'
      )

      return
    }

    this.contract = new ethers.Contract(
      CollectionConfig.contractAddress!,
      ContractAbi,
      this.provider.getSigner()
    ) as NftContractType

    this.refreshContractState()
  }

  private registerWalletEvents(browserProvider: ExternalProvider): void {
    // @ts-ignore
    browserProvider.on('accountsChanged', () => {
      this.initWallet()
    })

    // @ts-ignore
    browserProvider.on('chainChanged', () => {
      window.location.reload()
    })
  }
}
