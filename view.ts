import { TextFileView } from "obsidian";

export const VIEW_TYPE_CSV = "csv-view";

export class CSVView extends TextFileView {
  getViewData() {
    return this.data;
  }

  setViewData(data: string, clear: boolean) {
    this.data = data;
  }

  clear() {
    this.data = "";
  }

  getViewType() {
    return VIEW_TYPE_CSV;
  }
}