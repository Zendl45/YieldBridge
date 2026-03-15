import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

// ─── BSC Testnet chain definition ────────────────────────────────────────────
const bscTestnet = defineChain({
  id: 97,
  caipNetworkId: "eip155:97",
  chainNamespace: "eip155",
  name: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545/"] } },
  blockExplorers: { default: { name: "BscScan", url: "https://testnet.bscscan.com" } },
});

// ─── AppKit / WalletConnect setup ────────────────────────────────────────────
const PROJECT_ID = "f55a908b9f8b3a206393ca2708d25b2e";

const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bscTestnet],
  projectId: PROJECT_ID,
  metadata: {
    name: "YieldBridge",
    description: "The Smartest RWA Yield Router on BNB Chain",
    url: "https://yield-bridge.vercel.app",
    icons: ["https://yield-bridge.vercel.app/favicon.svg"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#f0b429",
    "--w3m-border-radius-master": "12px",
  },
});

// ─── Contract Config ──────────────────────────────────────────────────────────
const CONFIG = {
  explorer: "https://testnet.bscscan.com",
  contracts: {
    yieldBridge:  "0xC8573Ac3eB6594c6D52857A504632eC70d32a3fA",
    mockUSDT:     "0x8E8BF976C7fe7072Bc15b2c2Cad985874Ee65F58",
    mockUSDC:     "0xE48f03575bED290456e4422DAF58225DBbD2E2B5",
    rwaAdapter:   "0xF1d8190A2Ff18Aef326fd5650f98002e850746e8",
    venusAdapter: "0x2638EC1B85aE9978575E0204dbCaEF2A23706f22",
  },
};

const BRIDGE_ABI = [
  "function getAllAPYs(address token) view returns (address[],string[],uint256[],uint256[])",
  "function getPosition(address user, address token) view returns (address,string,uint256,uint256,uint256,uint256)",
  "function getBestSource(address token) view returns (address,uint256)",
  "function deposit(address token, uint256 amount)",
  "function withdraw(address token)",
  "function rebalance(address token)",
  "function feeBps() view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(val, dec = 18, places = 2) {
  if (!val || val === "0") return "0.00";
  try {
    const n = Number(BigInt(val.toString())) / Math.pow(10, dec);
    return n.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places });
  } catch { return "0.00"; }
}
function bpsToPercent(bps) { return (Number(bps) / 100).toFixed(2); }
function shortAddr(a) { return a ? a.slice(0,6) + "..." + a.slice(-4) : ""; }

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg:#060b14; --surface:rgba(255,255,255,0.04); --surface2:rgba(255,255,255,0.07);
  --border:rgba(255,255,255,0.08); --border2:rgba(240,180,41,0.25);
  --gold:#f0b429; --teal:#00d4aa; --text:#e8f0fe; --muted:#6b7fa3;
  --red:#ff6b6b; --green:#10b981; --blue:#4facfe;
}
html,body,#root { min-height:100vh; background:var(--bg); color:var(--text); font-family:'Syne',sans-serif; overflow-x:hidden; }
.bg-orbs { position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden; }
.orb { position:absolute;border-radius:50%;filter:blur(80px);opacity:0.15;animation:drift 20s ease-in-out infinite; }
.orb-1 { width:500px;height:500px;background:radial-gradient(circle,#f0b429,transparent);top:-100px;left:-100px; }
.orb-2 { width:400px;height:400px;background:radial-gradient(circle,#00d4aa,transparent);bottom:-100px;right:-100px;animation-delay:-7s; }
.orb-3 { width:300px;height:300px;background:radial-gradient(circle,#4facfe,transparent);top:50%;left:50%;animation-delay:-14s; }
@keyframes drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,30px) scale(0.95)} }
.bg-grid { position:fixed;inset:0;z-index:0;pointer-events:none; background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:50px 50px; }
.app { position:relative;z-index:1;max-width:480px;margin:0 auto;padding:0 16px 80px; }
nav { display:flex;align-items:center;justify-content:space-between;padding:18px 0;margin-bottom:4px; }
.nav-logo { display:flex;align-items:center;gap:10px; }
.nav-logo-text { font-size:20px;font-weight:800;color:#fff; }
.nav-logo-text em { color:var(--gold);font-style:normal; }
.nav-right { display:flex;align-items:center;gap:8px; }
.connect-btn { background:linear-gradient(135deg,var(--gold),#e6a817);color:#000;border:none;border-radius:12px;padding:10px 18px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent; }
.connect-btn:active { transform:scale(0.96); }
.connect-btn.connected { background:var(--surface2);color:var(--teal);border:1px solid rgba(0,212,170,0.3); }
.disconnect-btn { background:rgba(255,107,107,0.1);color:var(--red);border:1px solid rgba(255,107,107,0.3);border-radius:10px;padding:8px 12px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent; }
.disconnect-btn:active { transform:scale(0.96); }
.hero { text-align:center;padding:20px 0 28px; }
.hero-badge { display:inline-flex;align-items:center;gap:6px;background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.25);border-radius:20px;padding:5px 14px;margin-bottom:14px;font-size:11px;font-family:'DM Mono',monospace;color:var(--teal);text-transform:uppercase;letter-spacing:1px; }
.hero h1 { font-size:30px;font-weight:800;line-height:1.15;color:#fff;margin-bottom:10px; }
.hero h1 span { color:var(--gold); }
.hero p { font-size:13px;color:var(--muted);line-height:1.6;max-width:320px;margin:0 auto; }
.stats-bar { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px; }
.stat-card { background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 12px;text-align:center;backdrop-filter:blur(10px);transition:all 0.2s; }
.stat-card:hover { border-color:var(--border2);transform:translateY(-2px); }
.stat-val { font-size:18px;font-weight:800;color:var(--gold);font-family:'DM Mono',monospace; }
.stat-label { font-size:10px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:0.5px; }
.section-label { font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px;font-family:'DM Mono',monospace; }
.section-label::after { content:'';flex:1;height:1px;background:var(--border); }
.apy-cards { display:flex;flex-direction:column;gap:10px;margin-bottom:20px; }
.apy-card { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;backdrop-filter:blur(10px);transition:all 0.25s;position:relative;overflow:hidden; }
.apy-card:hover { border-color:var(--border2);transform:translateY(-2px); }
.apy-card.best { border-color:rgba(0,212,170,0.4);background:rgba(0,212,170,0.05); }
.apy-icon { width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0; }
.apy-info { flex:1;min-width:0; }
.apy-name { font-size:13px;font-weight:700;color:#fff;margin-bottom:3px; }
.apy-protocol { font-size:11px;color:var(--muted);font-family:'DM Mono',monospace; }
.apy-right { text-align:right; }
.apy-rate { font-size:22px;font-weight:800;color:var(--gold);font-family:'DM Mono',monospace; }
.apy-tvl { font-size:10px;color:var(--muted);margin-top:2px; }
.best-badge { position:absolute;top:10px;right:10px;background:var(--teal);color:#000;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase; }
.main-tabs { display:flex;gap:4px;background:var(--surface);border-radius:14px;padding:4px;margin-bottom:20px; }
.main-tab { flex:1;padding:10px;border-radius:10px;border:none;background:transparent;color:var(--muted);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent; }
.main-tab.active { background:var(--surface2);color:#fff; }
.panel { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px;backdrop-filter:blur(10px);margin-bottom:16px; }
.panel-title { font-size:16px;font-weight:800;color:#fff;margin-bottom:16px; }
.token-tabs { display:flex;gap:8px;margin-bottom:16px; }
.token-tab { flex:1;padding:10px;border-radius:12px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent; }
.token-tab.active { background:linear-gradient(135deg,rgba(240,180,41,0.15),rgba(240,180,41,0.05));border-color:var(--border2);color:var(--gold); }
.input-wrap { background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:12px;transition:border-color 0.2s; }
.input-wrap:focus-within { border-color:var(--border2); }
.input-label { font-size:11px;color:var(--muted);margin-bottom:6px;font-family:'DM Mono',monospace; }
.input-row { display:flex;align-items:center;gap:8px; }
.amount-input { flex:1;background:transparent;border:none;outline:none;color:#fff;font-family:'DM Mono',monospace;font-size:22px;font-weight:500; }
.amount-input::placeholder { color:var(--muted); }
.max-btn { background:rgba(240,180,41,0.15);border:1px solid var(--border2);color:var(--gold);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif; }
.balance-row { display:flex;justify-content:space-between;margin-top:8px; }
.balance-label { font-size:11px;color:var(--muted); }
.balance-val { font-size:11px;color:var(--teal);font-family:'DM Mono',monospace; }
.route-preview { background:rgba(0,212,170,0.06);border:1px solid rgba(0,212,170,0.15);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:12px; }
.route-row { display:flex;justify-content:space-between;align-items:center;padding:3px 0; }
.route-key { color:var(--muted); }
.route-val { color:#fff;font-family:'DM Mono',monospace;font-weight:500; }
.route-val.gold { color:var(--gold); }
.route-val.teal { color:var(--teal); }
.action-btn { width:100%;padding:16px;background:linear-gradient(135deg,var(--gold),#e6a817);color:#000;border:none;border-radius:14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;-webkit-tap-highlight-color:transparent; }
.action-btn:active { transform:scale(0.98); }
.action-btn:disabled { opacity:0.4;cursor:not-allowed; }
.action-btn.teal { background:linear-gradient(135deg,var(--teal),#00b894);color:#000; }
.action-btn.outline { background:transparent;border:1px solid var(--border2);color:var(--gold); }
.position-card { background:linear-gradient(135deg,rgba(240,180,41,0.08),rgba(0,212,170,0.05));border:1px solid rgba(240,180,41,0.2);border-radius:20px;padding:20px;margin-bottom:16px; }
.pos-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px; }
.pos-title { font-size:13px;color:var(--muted);margin-bottom:4px; }
.pos-amount { font-size:28px;font-weight:800;color:#fff;font-family:'DM Mono',monospace; }
.pos-token { font-size:13px;color:var(--gold);font-weight:700; }
.pos-badge { background:rgba(0,212,170,0.15);border:1px solid rgba(0,212,170,0.3);border-radius:20px;padding:4px 12px;font-size:11px;color:var(--teal);font-family:'DM Mono',monospace;white-space:nowrap; }
.pos-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px; }
.pos-item { background:rgba(0,0,0,0.2);border-radius:10px;padding:10px 12px; }
.pos-item-label { font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px; }
.pos-item-val { font-size:13px;font-weight:700;color:#fff;font-family:'DM Mono',monospace; }
.pos-actions { display:flex;gap:8px; }
.pos-actions button { flex:1; }
.spinner { width:16px;height:16px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block; }
@keyframes spin { to{transform:rotate(360deg)} }
.toast-wrap { position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:1000;display:flex;flex-direction:column;gap:8px;align-items:center; }
.toast { background:rgba(10,14,23,0.95);border:1px solid var(--border);border-radius:30px;padding:10px 20px;font-size:13px;font-family:'DM Mono',monospace;backdrop-filter:blur(20px);animation:toastIn 0.3s ease;white-space:nowrap; }
.toast.success { border-color:rgba(16,185,129,0.5);color:#10b981; }
.toast.error { border-color:rgba(255,107,107,0.5);color:#ff6b6b; }
.toast.info { border-color:var(--border2);color:var(--gold); }
@keyframes toastIn { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
.empty-state { text-align:center;padding:32px 16px;color:var(--muted);font-size:13px;line-height:1.7; }
.empty-icon { font-size:36px;margin-bottom:12px; }
.network-warn { background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.25);border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:8px; }
.switch-btn { margin-left:auto;background:none;border:1px solid var(--red);color:var(--red);padding:4px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-family:'Syne',sans-serif; }
.contracts-info { margin-top:16px;padding:12px 16px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid var(--border); }
.contracts-title { font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px; }
.contract-row { display:flex;justify-content:space-between;padding:3px 0;font-size:11px; }
.contract-name { color:var(--muted); }
.contract-link { color:var(--teal);font-family:'DM Mono',monospace;text-decoration:none; }
.skeleton { background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px; }
@keyframes shimmer { to{background-position:-200% 0} }
`;

function BridgeLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ borderRadius: 10, flexShrink: 0 }}>
      <rect width="100" height="100" rx="20" fill="#0a1628"/>
      <rect x="0" y="0" width="100" height="60" fill="#1a2a4a"/>
      <rect x="0" y="60" width="100" height="40" fill="#0d2137"/>
      <rect x="28" y="28" width="6" height="37" fill="#f0b429"/>
      <rect x="66" y="28" width="6" height="37" fill="#f0b429"/>
      <line x1="31" y1="28" x2="50" y2="50" stroke="#f0b429" strokeWidth="1.5" opacity="0.8"/>
      <line x1="69" y1="28" x2="50" y2="50" stroke="#f0b429" strokeWidth="1.5" opacity="0.8"/>
      <line x1="31" y1="28" x2="18" y2="50" stroke="#f0b429" strokeWidth="1.5" opacity="0.7"/>
      <line x1="69" y1="28" x2="82" y2="50" stroke="#f0b429" strokeWidth="1.5" opacity="0.7"/>
      <rect x="12" y="50" width="76" height="5" rx="2" fill="#f0b429"/>
      <circle cx="15" cy="14" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="50" cy="9" r="1" fill="white" opacity="0.6"/>
      <circle cx="82" cy="18" r="1.5" fill="white" opacity="0.7"/>
    </svg>
  );
}

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [chainOk, setChainOk] = useState(false);
  const [tab, setTab] = useState("deposit");
  const [token, setToken] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [apyData, setApyData] = useState([]);
  const [position, setPosition] = useState(null);
  const [balance, setBalance] = useState("0");
  const [bestSource, setBestSource] = useState(null);
  const [feeBps, setFeeBps] = useState(10);
  const [loading, setLoading] = useState(false);
  const [apyLoading, setApyLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const tokenAddr = token === "USDT" ? CONFIG.contracts.mockUSDT : CONFIG.contracts.mockUSDC;

  function addToast(msg, type = "info") {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  function getProvider() {
    if (!window.ethereum) throw new Error("No wallet found.");
    return new ethers.BrowserProvider(window.ethereum);
  }

  function getBridgeContract(sp) { return new ethers.Contract(CONFIG.contracts.yieldBridge, BRIDGE_ABI, sp); }
  function getTokenContract(sp)  { return new ethers.Contract(tokenAddr, ERC20_ABI, sp); }

  // Listen to AppKit wallet state changes
  useEffect(() => {
    const unsub = modal.subscribeProvider(({ address, chainId, isConnected }) => {
      if (isConnected && address) {
        setWallet(address);
        setChainOk(chainId === 97);
      } else {
        setWallet(null);
        setChainOk(false);
        setBalance("0");
        setPosition(null);
      }
    });
    return () => unsub();
  }, []);

  function openWalletModal() { modal.open(); }

  function disconnectWallet() {
    modal.disconnect();
    addToast("Wallet disconnected", "info");
  }

  async function switchNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }],
      });
      setChainOk(true);
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x61",
            chainName: "BNB Smart Chain Testnet",
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          }],
        });
        setChainOk(true);
      }
    }
  }

  const loadAPYs = useCallback(async () => {
    try {
      setApyLoading(true);
      const provider = getProvider();
      const bridge = getBridgeContract(provider);
      const [addrs, names, apys, tvls] = await bridge.getAllAPYs(tokenAddr);
      const [bestAddr] = await bridge.getBestSource(tokenAddr);
      const fee = await bridge.feeBps();
      setFeeBps(Number(fee));
      setBestSource(bestAddr.toLowerCase());
      setApyData(addrs.map((a, i) => ({ address: a.toLowerCase(), name: names[i], apy: Number(apys[i]), tvl: tvls[i].toString() })));
    } catch (e) { console.error(e); }
    finally { setApyLoading(false); }
  }, [tokenAddr]);

  const loadBalance = useCallback(async () => {
    if (!wallet) return;
    try {
      const bal = await getTokenContract(getProvider()).balanceOf(wallet);
      setBalance(bal.toString());
    } catch (e) { console.error(e); }
  }, [wallet, tokenAddr]);

  const loadPosition = useCallback(async () => {
    if (!wallet) return;
    try {
      const [src, srcName, shares, apy, depositedAt, principal] = await getBridgeContract(getProvider()).getPosition(wallet, tokenAddr);
      if (shares.toString() === "0") { setPosition(null); return; }
      setPosition({ src, srcName, shares: shares.toString(), apy: Number(apy), depositedAt: Number(depositedAt), principal: principal.toString() });
    } catch (e) { console.error(e); }
  }, [wallet, tokenAddr]);

  useEffect(() => { loadAPYs(); }, [loadAPYs]);
  useEffect(() => { if (wallet) { loadBalance(); loadPosition(); } }, [wallet, loadBalance, loadPosition]);

  async function handleDeposit() {
    if (!wallet) { addToast("Connect wallet first", "error"); return; }
    if (!amount || Number(amount) <= 0) { addToast("Enter a valid amount", "error"); return; }
    setLoading(true);
    try {
      const signer = await getProvider().getSigner();
      const tc = getTokenContract(signer);
      const bc = getBridgeContract(signer);
      const amt = ethers.parseUnits(amount, 18);
      const allowance = await tc.allowance(wallet, CONFIG.contracts.yieldBridge);
      if (allowance < amt) {
        addToast("Approving token spend...", "info");
        await (await tc.approve(CONFIG.contracts.yieldBridge, amt * 2n)).wait();
        addToast("Approved ✓", "success");
      }
      addToast("Sending deposit...", "info");
      await (await bc.deposit(tokenAddr, amt)).wait();
      addToast(`Deposited ${amount} ${token} ✓`, "success");
      setAmount(""); loadBalance(); loadPosition();
    } catch (e) { addToast(e.reason || e.message?.slice(0,60) || "Transaction failed", "error"); }
    finally { setLoading(false); }
  }

  async function handleWithdraw() {
    if (!wallet || !position) return;
    setLoading(true);
    try {
      const signer = await getProvider().getSigner();
      addToast("Withdrawing...", "info");
      await (await getBridgeContract(signer).withdraw(tokenAddr)).wait();
      addToast("Withdrawn successfully ✓", "success");
      loadBalance(); loadPosition();
    } catch (e) { addToast(e.reason || e.message?.slice(0,60) || "Withdraw failed", "error"); }
    finally { setLoading(false); }
  }

  async function handleRebalance() {
    if (!wallet || !position) return;
    setLoading(true);
    try {
      const signer = await getProvider().getSigner();
      addToast("Rebalancing...", "info");
      await (await getBridgeContract(signer).rebalance(tokenAddr)).wait();
      addToast("Rebalanced to best yield ✓", "success");
      loadPosition();
    } catch (e) { addToast(e.reason || e.message?.slice(0,60) || "Rebalance failed", "error"); }
    finally { setLoading(false); }
  }

  const bestApy = bestSource && apyData.find(a => a.address === bestSource);
  const netAmount = amount ? (Number(amount) * (1 - feeBps / 10000)).toFixed(4) : "0";

  return (
    <>
      <style>{CSS}</style>
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <div className="bg-grid"/>
      <div className="app">
        <nav>
          <div className="nav-logo">
            <BridgeLogo size={36}/>
            <span className="nav-logo-text">Yield<em>Bridge</em></span>
          </div>
          <div className="nav-right">
            {wallet && <button className="disconnect-btn" onClick={disconnectWallet}>Disconnect</button>}
            <button className={`connect-btn ${wallet ? "connected" : ""}`} onClick={openWalletModal}>
              {wallet ? `🟢 ${shortAddr(wallet)}` : "Connect Wallet"}
            </button>
          </div>
        </nav>

        {wallet && !chainOk && (
          <div className="network-warn">
            Wrong network. Switch to BSC Testnet.
            <button className="switch-btn" onClick={switchNetwork}>Switch</button>
          </div>
        )}

        <div className="hero">
          <div className="hero-badge">🌉 BNB Chain · RWA Yield</div>
          <h1>The Smartest <span>RWA Yield</span> Router</h1>
          <p>Deposit stablecoins and automatically earn the highest Real World Asset yield. No manual research needed.</p>
        </div>

        <div className="stats-bar">
          <div className="stat-card"><div className="stat-val">{bestApy ? bpsToPercent(bestApy.apy)+"%" : "—"}</div><div className="stat-label">Best APY</div></div>
          <div className="stat-card"><div className="stat-val">{apyData.length}</div><div className="stat-label">Sources</div></div>
          <div className="stat-card"><div className="stat-val">{(feeBps/100).toFixed(2)}%</div><div className="stat-label">Fee</div></div>
        </div>

        <div className="section-label">Live APY Comparison</div>
        <div className="apy-cards">
          {apyLoading ? [1,2].map(i => (
            <div key={i} className="apy-card">
              <div className="skeleton" style={{width:44,height:44,borderRadius:12}}/>
              <div style={{flex:1}}><div className="skeleton" style={{height:14,width:"60%",marginBottom:6}}/><div className="skeleton" style={{height:11,width:"40%"}}/></div>
              <div className="skeleton" style={{height:28,width:64}}/>
            </div>
          )) : apyData.map(src => (
            <div key={src.address} className={`apy-card ${src.address === bestSource ? "best" : ""}`}>
              {src.address === bestSource && <div className="best-badge">Best</div>}
              <div className="apy-icon" style={{background: src.address === bestSource ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.05)"}}>
                {src.name.includes("Venus") ? "🏛" : "🏦"}
              </div>
              <div className="apy-info">
                <div className="apy-name">{src.name.split("(")[0].trim()}</div>
                <div className="apy-protocol">{src.name.includes("(") ? src.name.match(/\(([^)]+)\)/)?.[1] : "BNB Chain"}</div>
              </div>
              <div className="apy-right">
                <div className="apy-rate">{bpsToPercent(src.apy)}%</div>
                <div className="apy-tvl">TVL ${fmt(src.tvl,18,0)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="main-tabs">
          <button className={`main-tab ${tab==="deposit"?"active":""}`} onClick={()=>setTab("deposit")}>Deposit</button>
          <button className={`main-tab ${tab==="position"?"active":""}`} onClick={()=>setTab("position")}>My Position</button>
        </div>

        {tab === "deposit" && (
          <div className="panel">
            <div className="panel-title">⬆ Deposit Stablecoins</div>
            <div className="token-tabs">
              {["USDT","USDC"].map(t => <button key={t} className={`token-tab ${token===t?"active":""}`} onClick={()=>setToken(t)}>{t}</button>)}
            </div>
            <div className="input-wrap">
              <div className="input-label">Amount to deposit</div>
              <div className="input-row">
                <input className="amount-input" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} min="0"/>
                <button className="max-btn" onClick={()=>setAmount(fmt(balance,18,4))}>MAX</button>
              </div>
              <div className="balance-row">
                <span className="balance-label">Wallet Balance</span>
                <span className="balance-val">{fmt(balance,18,2)} {token}</span>
              </div>
            </div>
            {amount && Number(amount) > 0 && bestApy && (
              <div className="route-preview">
                <div className="route-row"><span className="route-key">Routed to</span><span className="route-val teal">{bestApy.name.split("(")[0].trim()}</span></div>
                <div className="route-row"><span className="route-key">You earn</span><span className="route-val gold">{bpsToPercent(bestApy.apy)}% APY</span></div>
                <div className="route-row"><span className="route-key">Protocol fee</span><span className="route-val">{(feeBps/100).toFixed(2)}%</span></div>
                <div className="route-row"><span className="route-key">Net deposit</span><span className="route-val gold">{netAmount} {token}</span></div>
              </div>
            )}
            <button className="action-btn" onClick={handleDeposit} disabled={loading||!wallet||!amount}>
              {loading ? <><span className="spinner"/>Processing...</> : wallet ? `Deposit ${token}` : "Connect Wallet to Deposit"}
            </button>
          </div>
        )}

        {tab === "position" && (
          <>
            {!wallet ? (
              <div className="empty-state"><div className="empty-icon">🔌</div>Connect your wallet to view your position</div>
            ) : !position ? (
              <div className="empty-state"><div className="empty-icon">📭</div>No active {token} position.<br/>Go to Deposit to start earning RWA yield.</div>
            ) : (
              <div className="position-card">
                <div className="pos-header">
                  <div>
                    <div className="pos-title">Active Position</div>
                    <div className="pos-amount">{fmt(position.principal,18,2)} <span className="pos-token">{token}</span></div>
                  </div>
                  <div className="pos-badge">{bpsToPercent(position.apy)}% APY</div>
                </div>
                <div className="pos-grid">
                  <div className="pos-item"><div className="pos-item-label">Protocol</div><div className="pos-item-val">{position.srcName.split("(")[0].trim()}</div></div>
                  <div className="pos-item"><div className="pos-item-label">Since</div><div className="pos-item-val">{new Date(position.depositedAt*1000).toLocaleDateString()}</div></div>
                </div>
                <div className="pos-actions">
                  <button className="action-btn teal" onClick={handleRebalance} disabled={loading}>{loading?<span className="spinner"/>:"⚖ Rebalance"}</button>
                  <button className="action-btn outline" onClick={handleWithdraw} disabled={loading}>{loading?<span className="spinner"/>:"⬇ Withdraw"}</button>
                </div>
              </div>
            )}
            <div className="token-tabs" style={{marginTop:8}}>
              {["USDT","USDC"].map(t => <button key={t} className={`token-tab ${token===t?"active":""}`} onClick={()=>setToken(t)}>{t}</button>)}
            </div>
          </>
        )}

        <div className="contracts-info">
          <div className="contracts-title">Deployed Contracts · BSC Testnet</div>
          {[["YieldBridge",CONFIG.contracts.yieldBridge],["Mock USDT",CONFIG.contracts.mockUSDT],["Mock USDC",CONFIG.contracts.mockUSDC]].map(([name,addr])=>(
            <div key={addr} className="contract-row">
              <span className="contract-name">{name}</span>
              <a className="contract-link" href={`${CONFIG.explorer}/address/${addr}`} target="_blank" rel="noreferrer">{shortAddr(addr)}</a>
            </div>
          ))}
        </div>
      </div>
      <div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>
    </>
  );
}
