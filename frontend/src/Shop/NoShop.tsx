import GridShape from "../components/common/GridShape";
import { Link } from "react-router";

export default function NoShop() {
  return (
    <>
      <div className="relative flex flex-col items-center justify-center p-6 overflow-hidden z-1">
        <GridShape />
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <img
            src="/images/icons/no-results.png"
            alt="404"
            className="block h-40 w-40 md:h-60 md:w-60 mx-auto"
          />

          <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            No Products available. Contact Administrator.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </>
  );
}
