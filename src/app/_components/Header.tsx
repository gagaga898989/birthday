"use client";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFish } from "@fortawesome/free-solid-svg-icons";
import { faCake } from "@fortawesome/free-solid-svg-icons/faCake";

const Header: React.FC = () => {
  return (
    <header>
      <div className="bg-slate-800 py-2">
        <div
          className={twMerge(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
          <div>
            <FontAwesomeIcon icon={faCake} className="mr-1" />
            Header
          </div>
          <div>About</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
