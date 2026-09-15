const PageLoader = () => {
  return (
    <div className="admin-page-loader" role="status" aria-live="polite">
      <div className="admin-spinner" aria-hidden="true"></div>
      <p className="admin-loader-text">Loading data...</p>
    </div>
  );
};

export default PageLoader;

