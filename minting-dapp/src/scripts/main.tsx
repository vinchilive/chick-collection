import '../styles/main.scss'
import 'react-toastify/dist/ReactToastify.css'

import ReactDOM from 'react-dom'
import Dapp from './react/Dapp'
import CollectionConfig from '../../../smart-contract/config/CollectionConfig'
import { ToastContainer } from 'react-toastify'

if (document.title === '') {
  document.title = CollectionConfig.tokenName
}

document.addEventListener('DOMContentLoaded', async () => {
  ReactDOM.render(
    <>
      <ToastContainer
        position="top-left"
        autoClose={5000}
        closeOnClick={true}
        pauseOnHover={true}
        theme="light"
      />
    </>,
    document.getElementById('notifications')
  )

  ReactDOM.render(
    <>
      <Dapp />
      <div className="flex px-6 py-2 max-w-sm mx-auto mt-6">
        <div className="w-1/2 shrink-0">
          <img src="/build/images/chick.png" alt="Chick" />
        </div>
        <div className="flex items-center justify-center relative">
          <div className="rounded-3xl bg-sky-400 px-4 py-2 text-sky-400 text-center text-sm tooltip">
            <span className="text-white">
              Much Love & Welcome to the flock - Cheeky Chooks team ❤️
            </span>
          </div>
        </div>
      </div>
    </>,
    document.getElementById('minting-dapp')
  )
})
