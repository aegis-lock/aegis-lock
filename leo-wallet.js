import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';
import { WalletDecryptPermission } from '@provablehq/aleo-wallet-standard';
import { Network } from '@provablehq/aleo-types';

const isMobile =
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const adapter = new LeoWalletAdapter({
  appName: 'AEGIS',
  appDescription: 'AEGIS - Private Asset Locking Infrastructure',
  isMobile,
  mobileWebviewUrl: window.location.href
});

/*
 * Make the same Leo Wallet adapter available to Page 2.
 * This does NOT change the existing Connect flow.
 */
window.usdcxLeoAdapter = adapter;

function initLeoWallet() {
  const connectButton = document.querySelector('.btn-connect');

  if (!connectButton) {
    console.error('USDCx LOCKED: Connect button not found');
    return;
  }

  connectButton.addEventListener('click', async () => {
    try {
      connectButton.disabled = true;

      console.log(
        'USDCx LOCKED: Connecting to Leo Wallet on MAINNET...',
        { isMobile }
      );

      const account = await adapter.connect(
        Network.MAINNET,
        WalletDecryptPermission.NoDecrypt
      );

      console.log(
        'USDCx LOCKED: Leo Wallet connected:',
        account
      );

      const address =
        account?.address ||
        account?.publicKey ||
        adapter.publicKey;

      if (!address) {
        throw new Error(
          'Leo Wallet connected but no address was returned.'
        );
      }

      console.log(
        'USDCx LOCKED: Wallet address:',
        address
      );

      sessionStorage.setItem(
        'usdcxAddress',
        address
      );

      sessionStorage.setItem(
        'walletAddress',
        address
      );

      connectButton.textContent =
        address.slice(0, 10) +
        '...' +
        address.slice(-6);

      setTimeout(() => {
        window.location.href = './page2.html';
      }, 300);

    } catch (error) {
      console.error(
        'USDCx LOCKED: Leo Wallet connection failed:',
        error
      );

      connectButton.disabled = false;
    }
  });

  console.log(
    'USDCx LOCKED: Leo Wallet connector ready - MAINNET',
    { isMobile }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initLeoWallet
  );
} else {
  initLeoWallet();
}