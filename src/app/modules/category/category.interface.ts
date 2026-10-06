export interface ICategoryCreateInput {
  name: string;
  icon?: string;
  parentId?: string; // সাব-ক্যাটাগরির ক্ষেত্রে মূল ক্যাটাগরির আইডি
}

export interface ICategoryUpdateInput {
  name?: string;
  icon?: string;
  parentId?: string;
}