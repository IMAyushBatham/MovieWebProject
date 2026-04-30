import { createContext, useContext, useState } from "react";

const BrowseContext = createContext();

export const useBrowse = () => useContext(BrowseContext);

export const BrowseProvider = ({ children }) => {
  const [activeFilter, setActiveFilter] = useState(null); // { type, value } | null
  const [activeSort, setActiveSort] = useState("popularity.desc");

  const applyBrowse = ({ genre, region, sort }) => {
    if (region) setActiveFilter({ type: "language", value: region });
    else if (genre) setActiveFilter({ type: "genre", value: genre });
    else setActiveFilter(null);
    setActiveSort(sort ?? "popularity.desc");
  };

  const clearBrowse = () => {
    setActiveFilter(null);
    setActiveSort("popularity.desc");
  };

  return (
    <BrowseContext.Provider
      value={{ activeFilter, activeSort, applyBrowse, clearBrowse }}
    >
      {children}
    </BrowseContext.Provider>
  );
};
