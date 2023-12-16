export default function rot(msg, num) {
  const sets = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"];
  const safeNumber = (num, mod) => ((num % mod) + mod) % mod;
  let ret = "";
  for (let i = 0; i < msg.length; i++) {
    let add = msg[i];
    for (let j = 0; j < sets.length; j++)
      if (sets[j].indexOf(msg[i]) !== -1)
        add =
          sets[j][
            safeNumber(
              sets[j].indexOf(msg[i]) + num,
              sets[j].length
            )
          ];
    ret += add;
  }
  return ret;
}