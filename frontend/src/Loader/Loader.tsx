const Loader = () => {
  return (
    <section className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      {/* Logo + Spinner Combo */}
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400"></div>

        {/* Logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Loader;
