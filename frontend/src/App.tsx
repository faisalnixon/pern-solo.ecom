import {
  useAuth,
} from "@clerk/react";
import PageLoader from "./components/PageLoader";
import Layout from "./components/Layout";

function App() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <PageLoader />;

  return (
    <Layout>
     
      <p className="text-4xl font-extrabold bg-blue-700 text-amber-600">
        Welcome to the App!{" "}
      </p>
      <button className="btn  bg-amber-600 rounded-2xl">Click me</button>
      <button className="btn btn-success">Click me</button>
      <button className="btn btn-secondary">Click me</button>
    </Layout>
  );
}

export default App;
