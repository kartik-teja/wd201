const todoList = require("../todo");

const {
  all,
  add,
  markAsComplete,
  overdue,
  dueToday,
  dueLater,
  toDisplayableList,
} = todoList();

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
  .toISOString()
  .split("T")[0];
const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
  .toISOString()
  .split("T")[0];
describe("First test suite", () => {
  beforeAll(async () => {
    add({
      title: "Test 0",
      completed: false,
      dueDate: today,
    });
  });

  test("Should mark to do as complete", async () => {
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });

  test("Should return today entries", async () => {
    add({
      title: "Test 2",
      completed: false,
      dueDate: today,
    });
    const todaytodo = await dueToday();
    expect(todaytodo.length).toBe(2);
  });

  test("Should return overdue entries", async () => {
    add({
      title: "Test 1",
      completed: false,
      dueDate: yesterday,
    });
    const yesterdaytodo = await overdue();
    expect(yesterdaytodo.length).toBe(1);
  });

  test("Should return tomorrow entries", async () => {
    add({
      title: "Test 3",
      completed: false,
      dueDate: tomorrow,
    });
    const tomorrowtodo = await dueLater();
    expect(tomorrowtodo.length).toBe(1);
  });

  test("Should display the entries", async () => {
    const inputList = [
      {
        title: "Test 1",
        completed: false,
        dueDate: yesterday,
      },
      {
        title: "Test 2",
        completed: true,
        dueDate: today,
      },
      {
        title: "Test 3",
        completed: false,
        dueDate: tomorrow,
      },
    ];

    const expectedOutput =
      "[ ] Test 1 " + yesterday + "\n[x] Test 2\n[ ] Test 3 " + tomorrow;

    const result = toDisplayableList(inputList);

    expect(result).toBe(expectedOutput);
  });

  test("Should add new todo", async () => {
    const todolength = all.length;
    add({
      title: "add case",
      completed: false,
      dueDate: today,
    });
    expect(all.length).toBe(todolength + 1);
  });
});
