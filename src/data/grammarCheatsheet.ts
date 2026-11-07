export interface CheatsheetRule {
  id: string;
  category: string;
  title: string;
  shortRule: string;
  formula: string;
  exampleSentence: string;
  keyTip: string;
}

export const TOEIC_BEGINNER_RULES: CheatsheetRule[] = [
  {
    id: 'rule-1',
    category: '품사 자리',
    title: '1초 명사 자리 공식',
    shortRule: '관사(a/an/the) or 소유격 뒤는 무조건 명사',
    formula: 'a / an / the / 소유격 + (형용사) + [명사]',
    exampleSentence: 'The marketing team submitted a detailed [proposal].',
    keyTip: '-tion, -sion, -ment, -ance, -ence, -ty, -al(proposal/approval)로 끝나면 명사입니다!',
  },
  {
    id: 'rule-2',
    category: '품사 자리',
    title: '완전문장 수식은 부사(-ly)',
    shortRule: '문장의 필수요소가 다 있으면 빈칸은 100% 부사',
    formula: '주어 + 동사 + 목적어 + [부사(-ly)] / [부사] + 동사',
    exampleSentence: 'Mr. Johnson reviewed the report very [carefully].',
    keyTip: '동사를 꾸미거나 문장 끝에서 추가 정보를 주는 자리는 부사 자리입니다.',
  },
  {
    id: 'rule-3',
    category: '전치사 vs 접속사',
    title: '명사구 vs 주어+동사 판별법',
    shortRule: '뒤에 절(S+V)이 오면 접속사, 명사만 오면 전치사',
    formula: '전치사 + [명사/동명사]  vs  접속사 + [주어 + 동사]',
    exampleSentence: '[Despite] the storm (명사) vs [Although] it rained (주어+동사)',
    keyTip: '★ 암기: Because of, Due to, Despite, During = 전치사 / Because, Although, While = 접속사',
  },
  {
    id: 'rule-4',
    category: '대명사',
    title: '명사 앞은 1초 만에 소유격 선택',
    shortRule: '뒤에 명사가 붙어있으면 묻지도 따지지도 말고 소유격',
    formula: '[소유격 (my/your/his/her/their/our)] + 명사',
    exampleSentence: 'Employees must submit [their] travel receipts.',
    keyTip: '선택지에 they(주격), them(목적격), their(소유격), theirs(소유대명사)가 나오면 빈칸 뒤 명사를 먼저 확인하세요.',
  },
  {
    id: 'rule-5',
    category: '동사 (수/시제/태)',
    title: '능동태 vs 수동태 목적어 유무',
    shortRule: '뒤에 목적어(명사)가 없으면 be + p.p.(수동태)',
    formula: '타동사 + [목적어 명사] (능동)  vs  be + [p.p.] + (전치사구/마침표) (수동)',
    exampleSentence: 'All packages must be [inspected] before departure.',
    keyTip: '사물 주어가 오고 뒤에 목적어 명사가 없다면 95% 이상 be + p.p. 수동태가 정답입니다.',
  },
  {
    id: 'rule-6',
    category: '초급 빈출 어휘',
    title: '1초 짝꿍 전치사 & 연어 (Collocations)',
    shortRule: '동사 뒤 전치사를 보고 한눈에 동사 찍기',
    formula: 'register for (~에 등록하다) / comply with (~을 준수하다) / apologize for (~에 사과하다)',
    exampleSentence: 'All attendees must [register] for the workshop.',
    keyTip: 'comply with, agree with/to, participate in, rely on, respond to는 토익에 매달 나오는 단골입니다!',
  },
];
