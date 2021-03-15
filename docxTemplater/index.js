/* eslint-disable no-console */
import createReport from "docx-templates";

var exportWord = async function(item, url, other, functions) {
  const templateFile = await fetch(url);
  const templateBlob = await templateFile.blob();
  const template = await readFileIntoArrayBuffer(templateBlob);
  console.log(functions);
  const report = await createReport({
    template,
    data: {
      item: item,
      other: other,
    },
    additionalJsContext: functions,
  });
  saveDataToFile(report, `${item.name}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
};

const readFileIntoArrayBuffer = fd =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(fd);
  });

const saveDataToFile = (data, fileName, mimeType) => {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  downloadURL(url, fileName, mimeType);
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
};

const downloadURL = (data, fileName) => {
  const a = document.createElement("a");
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = "display: none";
  a.click();
  a.remove();
};

module.exports = {
  exportWord: exportWord,
};
