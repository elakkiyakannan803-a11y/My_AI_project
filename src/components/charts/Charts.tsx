import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

const COLORS = ['#06b6d4', '#22d3ee', '#67e8f9', '#0e7490', '#0891b2', '#155e75'];

const tooltipStyle = {
  backgroundColor: '#152142',
  border: '1px solid #2a3f7a',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fff',
};

export function EligibilityOverviewChart({ data }: { data: { name: string; value: number; fill: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadialBarChart innerRadius="30%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
        <RadialBar background dataKey="value" cornerRadius={8} />
        <Legend
          iconType="circle"
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: '11px', color: '#a9b9dd', paddingTop: '8px' }}
        />
        <Tooltip contentStyle={tooltipStyle} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function IncomeVsEMIChart({ data }: { data: { month: string; income: number; emi: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorEMI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2f5c" />
        <XAxis dataKey="month" stroke="#6e88c4" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6e88c4" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="income" name="Income" stroke="#06b6d4" fill="url(#colorIncome)" strokeWidth={2} />
        <Area type="monotone" dataKey="emi" name="EMI" stroke="#f59e0b" fill="url(#colorEMI)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ApplicationStatusChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2f5c" />
        <XAxis dataKey="status" stroke="#6e88c4" tick={{ fontSize: 10 }} />
        <YAxis stroke="#6e88c4" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e2f5c40' }} />
        <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#0f1729" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          iconType="circle"
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: '11px', color: '#a9b9dd', paddingTop: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PrincipalInterestChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#0f1729" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          iconType="circle"
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: '11px', color: '#a9b9dd' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
