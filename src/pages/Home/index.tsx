import React from 'react';
import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  return (
    <div style={{ padding: '20px 32px 24px' }}>
      <Title heading={5}>字节云 Vibe Playground</Title>
      <Paragraph style={{ color: 'var(--color-text-3)', marginTop: 8 }}>
        这是一个空白的起始页面。使用 ve_o_design_tod skill 描述你的业务需求，即可在此项目中生成标准页面。
      </Paragraph>
      <Paragraph style={{ color: 'var(--color-text-2)', marginTop: 16, background: 'var(--color-bg-3)', padding: '12px 16px', borderRadius: 4 }}>
        Use Skill: ve_o_design_tod 帮我生成一个服务列表页，包含名称、状态、创建时间列，支持按名称搜索和按状态筛选，表格支持分页
      </Paragraph>
      <Paragraph style={{ color: 'var(--color-text-3)', marginTop: 16 }}>
        物料库已就绪：@tod-m/materials（X 系列 + ve-o 基础 UI）+ @arco-design/web-react（兜底）
      </Paragraph>
    </div>
  );
};

export default Home;
