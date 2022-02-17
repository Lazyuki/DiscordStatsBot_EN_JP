// Run something at a specified time over setTimeout's limit of around 25 days
// tslint:disable-next-line:ban-types
const runAt = (date: Date, func: Function) => {
  const now = new Date().getTime();
  const then = date.getTime();
  const diff = Math.max(then - now, 0);
  if (diff > 0x7f_fff_fff)
    setTimeout(() => {
      runAt(date, func);
    }, 0x7fffffff);
  else setTimeout(func, diff);
};

export default runAt;
