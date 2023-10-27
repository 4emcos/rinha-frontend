export const insertTabIndexes = () => {
  const elements = document.getElementsByClassName("w-rjv-object-key");
  for (let i = 0; i < elements.length; i++) {
    elements[i].setAttribute("tabIndex", "0");
  }
};
