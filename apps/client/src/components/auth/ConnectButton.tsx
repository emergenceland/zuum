import connect from "../../assets/connect-button.png";
import { authURL } from "../../lib/utils";

const ConnectButton = () => {
  return (
    <button onClick={() => window.location.assign(authURL)}>
      <img
        src={connect}
        alt="Connect with Strava"
        className="cursor-pointer rounded-md hover:scale-105 transition-all"
        style={{ height: `48px` }}
      />
    </button>
  );
};

export default ConnectButton;
