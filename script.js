const SHEET_ID = 'your_sheet_id_here';
const URL = `https://docs.google.com/spreadsheets/d/1CMHasd5gdUrS-l_BbOsc6W6l9IHzk_LSobQ1TQ3oVKw/export?format=csv`;

let data = {};

fetch(URL)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.split('\n').map(r => r.split(','));
    const headers = rows[0];

    headers.forEach((header, i) => {
      data[header.trim()] = rows
        .slice(1)
        .map(row => row[i]?.trim())
        .filter(Boolean);
    });

    const dropdown = document.getElementById('dropdown');
    headers.forEach(header => {
      const opt = document.createElement('option');
      opt.value = header.trim();
      opt.textContent = header.trim();
      dropdown.appendChild(opt);
    });
  })
  .catch(err => console.error('Failed to fetch sheet:', err));

document.getElementById('dropdown').addEventListener('change', function () {
  const names = data[this.value] || [];
  const tbody = document.getElementById('name-rows');

  tbody.innerHTML = names.map(name => `
    <tr>
      <td>${name}</td>
      <td><input type="checkbox" class="present-box" checked></td>
      <td><input type="checkbox" class="leader-box"></td>
    </tr>
  `).join('');
});

document.getElementById('generate-btn').addEventListener('click', () => {
  // collect present names and leaders from table
  const rows = document.querySelectorAll('#name-rows tr');
  const present = [];
  const leaders = [];

  rows.forEach(row => {
    const name = row.cells[0].textContent.trim();
    const isPresent = row.querySelector('.present-box').checked;
    const isLeader = row.querySelector('.leader-box').checked;

    if (isPresent) {
      present.push(name);
      if (isLeader) leaders.push(name);
    }
  });

  const nonLeaders = present.filter(n => !leaders.includes(n));

  // shuffle helper
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const inputVal = parseInt(document.getElementById('group-input').value);
  const total = present.length;

  // figure out group count
  let groupCount;
  if (mode === 'size') {
    groupCount = Math.ceil(total / inputVal);
  } else {
    groupCount = inputVal;
  }

  // build empty groups
  const groups = Array.from({ length: groupCount }, () => ({ leader: null, members: [] }));

  // shuffle leaders, fill gaps from non-leaders if not enough
  let shuffledLeaders = shuffle(leaders);
  let shuffledNonLeaders = shuffle(nonLeaders);

  // assign one leader per group
  for (let i = 0; i < groupCount; i++) {
    if (shuffledLeaders.length > 0) {
      groups[i].leader = shuffledLeaders.shift();
    } else {
      groups[i].leader = shuffledNonLeaders.shift();
    }
  }

  // remaining non-leaders pool (leaders already assigned don't get added again)
  const assigned = groups.map(g => g.leader);
  const remaining = shuffle(present.filter(n => !assigned.includes(n)));

  // calculate even distribution
  const base = Math.floor(remaining.length / groupCount);
  const extra = remaining.length % groupCount;

  let idx = 0;
  groups.forEach((group, i) => {
    const count = i < extra ? base + 1 : base;
    group.members = remaining.slice(idx, idx + count);
    idx += count;
  });

  // border colors for groups
const colors = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#8bc34a',
  '#ff5722', '#607d8b', '#673ab7', '#ffeb3b', '#795548'
];

  // render
  const output = document.getElementById('groups-output');
  output.innerHTML = groups.map((group, i) => {
    const color = colors[i % colors.length];
    const memberItems = group.members.map(n => `<li>${n}</li>`).join('');
    return `
      <div class="group-box" style="border-color: ${color}">
        <h3 style="color: ${color}">Group ${i + 1}</h3>
        <ul>
          <li class="leader">👑 ${group.leader}</li>
          ${memberItems}
        </ul>
      </div>
    `;
  }).join('');
});