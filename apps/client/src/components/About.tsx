import { Dispatch, SetStateAction } from "react";
import Button from "./common/Button";
import Spacer from "./common/Spacer";
import { useNavigate } from "react-router-dom";
import Header from "./common/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

type AboutProps = {
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
};
export default function About(props: AboutProps) {
  const { isLoggedIn, setIsLoggedIn } = props;
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  return (
    <div
      className="flex-grow w-screen flex flex-col justify-between p-4"
      style={{ height: `calc(100% - 54px)` }}
    >
      <Header />
      <div className="flex flex-col flex-grow overflow-scroll w-full text-base">
        <h1 className="text-3xl font-bold">About</h1>
        <Spacer height={16} />
        <p>
          Who can explore the most streets of Healdsburg? <br></br> <br></br>
          <span className="font-bold">Zuum</span> is an ongoing challenge during
          Edge Esmeralda.
        </p>
        <br></br>
        <p>
          On
          <span className="font-bold"> June 30th</span>, top explorers and
          anyone who gets at least <span className="font-bold"> 10 km</span>{" "}
          will get a prize!
        </p>
        <br></br>
        <Spacer height={32} />
        <h3 className="font-bold text-xl">How To Participate</h3>
        <Spacer height={16} />
        <ul
          className="list-decimal list-inside
"
        >
          <li>Record a walk, run, bike (or even 🛼) activity on Strava</li>
          <br></br>
          <li>
            Connect your Strava to Zuum to see which streets you've explored
          </li>
          <br></br>

          <li>Hit the ♺ button after you've added a new activity</li>
          <br></br>

          <li>
            You can only explore a street once, so keep trying new routes!
          </li>
        </ul>

        <Spacer height={32} />
        <br></br>

        <h3 className="font-bold text-xl">Don't see your activities?</h3>
        <Spacer height={16} />
        <p>Your map may be hidden on Strava.</p>
        <br></br>
        <p>
          {" "}
          For your activities to count, you must change the{" "}
          <span className="font-bold">Map Visibility</span> settings. From
          Strava, go to:
        </p>
        <Spacer height={16} />
        <div className="flex flex-row flex-wrap gap-2 items-center font-bold text-sm">
          <p>Settings</p>
          <FontAwesomeIcon icon={faArrowRight} />
          <p>Privacy Controls</p>
          <FontAwesomeIcon icon={faArrowRight} />
          <p>Map Visibility</p>
        </div>
        <Spacer height={16} />
        <p>Hidden areas of your map will not count.</p>
        <Spacer height={32} />
        <br></br>
        <h3 className="font-bold text-xl">Support</h3>
        <Spacer height={8} />
        <p>
          If you need help, please contact{" "}
          <a className="underline" href="mailto:0xcha0sg0d@gmail.com">
            the developers
          </a>
        </p>
        <Spacer height={24} />
        <br></br>
        {isLoggedIn && <Button text="Log out" onClick={handleLogout} />}
      </div>
    </div>
  );
}
