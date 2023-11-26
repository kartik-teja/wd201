const todoList = () => {
  const all = [];
  const add = (todoItem) => {
    all.push(todoItem);
  };
  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const overdue = () => {
    // Write the date check condition here and return the array
    // of overdue items accordingly.
    let over_due = all.filter(function (task) {
      let today = new Date().toISOString().split("T")[0];
      if (task.dueDate < today) {
        return task;
      }
    });
    return over_due;
  };

  const dueToday = () => {
    // Write the date check condition here and return the array
    // of todo items that are due today accordingly.
    let todoToday = all.filter(function (task) {
      let today = new Date().toISOString().split("T")[0];
      if (task.dueDate == today) {
        return task;
      }
    });
    return todoToday;
  };

  const dueLater = () => {
    // Write the date check condition here and return the array
    // of todo items that are due later accordingly.
    let due_later = all.filter(function (task) {
      let today = new Date().toISOString().split("T")[0];
      if (task.dueDate > today) {
        return task;
      }
    });
    return due_later;
  };

  const toDisplayableList = (list) => {
    // Format the To-Do list here, and return the output string
    // as per the format given above.
    let today = new Date().toISOString().split("T")[0];
    let displayableList = "";
    for (let i = 0; i < list.length; i++) {
      let check = list[i].completed === true ? "x" : " ";
      if (today === list[i].dueDate) {
        displayableList += `[${check}] ${list[i].title}`;
      } else {
        displayableList += `[${check}] ${list[i].title} ${list[i].dueDate}`;
      }

      if (i < list.length - 1) {
        displayableList += "\n";
      }
    }
    return displayableList;
  };
  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};
module.exports = todoList;
