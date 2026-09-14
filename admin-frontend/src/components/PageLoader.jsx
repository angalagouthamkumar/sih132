const PageLoader = () => {
  return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-border border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-primary-600 font-semibold animate-pulse">Loading data...</p>
    </div>
  );
};

export default PageLoader;
