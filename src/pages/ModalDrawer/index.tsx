import { Button, Drawer, Form, Input, InputNumber, Message, Modal, Radio, Select, Steps, Table, Tag } from '@tod-m/materials/ve-o';
import { IconDelete } from '@arco-design/web-react/icon';
import React, { useCallback, useState } from 'react';
import styles from './index.module.scss';

enum Mode {
  CLOSED = 'closed',
  RDMA = 'rdma',
  UserModeProtocolStack = 'user_mode_protocol_stack',
}

const MODE_LABEL: Record<Mode, string> = {
  [Mode.CLOSED]: '关闭',
  [Mode.RDMA]: 'RDMA',
  [Mode.UserModeProtocolStack]: '用户态协议栈',
};

const MOCK_IDC_OPTIONS = [
  { label: 'hl', value: 'hl' },
  { label: 'lf', value: 'lf' },
  { label: 'gz', value: 'gz' },
  { label: 'sg', value: 'sg' },
  { label: 'maliva', value: 'maliva' },
];

const ModalDrawer: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [stepForm] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  const handleModalSubmit = useCallback(() => {
    const values = form.getFieldsValue();
    console.log('Modal 提交:', values);
    Message.success('提交成功');
    setModalVisible(false);
    form.resetFields();
  }, [form]);

  const handleStepNext = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleStepSubmit = useCallback(() => {
    const values = stepForm.getFieldsValue();
    console.log('Step Modal 提交:', values);
    Message.success('提交成功');
    setStepModalVisible(false);
    stepForm.resetFields();
    setCurrentStep(0);
  }, [stepForm]);

  const handleDrawerSubmit = useCallback(() => {
    Message.success('抽屉操作完成');
    setDrawerVisible(false);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h3 className={styles.title}>弹窗与抽屉示例</h3>
        <p className={styles.desc}>点击下方按钮打开对应组件</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>弹窗（Modal）</div>
        <div className={styles.buttonGroup}>
          <Button type="primary" onClick={() => setModalVisible(true)}>
            打开表单弹窗
          </Button>
          <Button type="primary" onClick={() => setStepModalVisible(true)}>
            打开步骤弹窗
          </Button>
          <Button
            type="secondary"
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除此配置吗？删除后不可恢复。',
                okButtonProps: { status: 'danger' },
                onOk: () => { Message.success('已删除'); },
              });
            }}
          >
            确认弹窗
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>抽屉（Drawer）</div>
        <div className={styles.buttonGroup}>
          <Button type="primary" onClick={() => setDrawerVisible(true)}>
            打开详情抽屉
          </Button>
        </div>
      </div>

      {/* 表单弹窗 */}
      <Modal
        title="编辑 Archon 用户态协议栈"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalSubmit}
        style={{ width: 720 }}
      >
        <div className={styles.modalContent}>
          <div className={styles.vregionBar}>
            <span className={styles.vregionLabel}>VRegion</span>
            <span className={styles.vregionValue}>China-North</span>
          </div>
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>默认配置</div>
              <div className={styles.configCard}>
                <Form.Item label="生效 IDC" field="defaultIdc">
                  <Input value="all" disabled />
                </Form.Item>
                <Form.Item label="模式" field="defaultMode">
                  <Radio.Group>
                    <Radio value={Mode.CLOSED}>{MODE_LABEL[Mode.CLOSED]}</Radio>
                    <Radio value={Mode.RDMA}>{MODE_LABEL[Mode.RDMA]}</Radio>
                    <Radio value={Mode.UserModeProtocolStack}>{MODE_LABEL[Mode.UserModeProtocolStack]}</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label="灰度比例" field="defaultGrayRatio">
                  <InputNumber placeholder="1-100" suffix="%" min={1} max={100} style={{ width: 160 }} />
                </Form.Item>
              </div>
            </div>
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>IDC 独立配置</div>
              <Form.List field="idcConfigs">
                {(fields, { add, remove }) => (
                  <div className={styles.idcList}>
                    {fields.map(({ field, key }, index) => (
                      <div key={key} className={styles.idcCard}>
                        <button className={styles.idcDeleteBtn} type="button" onClick={() => remove(index)}>
                          <IconDelete />
                        </button>
                        <Form.Item label="IDC" field={`${field}.idc`}>
                          <Select options={MOCK_IDC_OPTIONS} placeholder="请选择 IDC" allowClear />
                        </Form.Item>
                        <Form.Item label="模式" field={`${field}.mode`}>
                          <Radio.Group>
                            <Radio value={Mode.CLOSED}>{MODE_LABEL[Mode.CLOSED]}</Radio>
                            <Radio value={Mode.RDMA}>{MODE_LABEL[Mode.RDMA]}</Radio>
                            <Radio value={Mode.UserModeProtocolStack}>{MODE_LABEL[Mode.UserModeProtocolStack]}</Radio>
                          </Radio.Group>
                        </Form.Item>
                        <Form.Item label="灰度比例" field={`${field}.grayRatio`}>
                          <InputNumber placeholder="1-100" suffix="%" min={1} max={100} style={{ width: 160 }} />
                        </Form.Item>
                      </div>
                    ))}
                    <button className={styles.addConfigBtn} type="button" onClick={() => add({})}>
                      + 添加 IDC 配置
                    </button>
                  </div>
                )}
              </Form.List>
            </div>
          </Form>
        </div>
      </Modal>

      {/* 步骤弹窗 */}
      <Modal
        title="Archon 用户态协议栈"
        visible={stepModalVisible}
        onCancel={() => { setStepModalVisible(false); setCurrentStep(0); }}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {currentStep === 0 && <Button onClick={() => setStepModalVisible(false)}>取消</Button>}
            {currentStep === 1 && <Button onClick={() => setCurrentStep(0)}>上一步</Button>}
            {currentStep === 0 && <Button type="primary" onClick={handleStepNext}>下一步</Button>}
            {currentStep === 1 && <Button type="primary" onClick={handleStepSubmit}>提交</Button>}
          </div>
        }
        style={{ width: 640 }}
      >
        <Steps current={currentStep + 1} style={{ marginBottom: 16 }}>
          <Steps.Step title="填写配置" />
          <Steps.Step title="变更确认" />
        </Steps>
        {currentStep === 0 && (
          <Form form={stepForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="模式" field="mode">
              <Radio.Group>
                <Radio value={Mode.CLOSED}>{MODE_LABEL[Mode.CLOSED]}</Radio>
                <Radio value={Mode.RDMA}>{MODE_LABEL[Mode.RDMA]}</Radio>
                <Radio value={Mode.UserModeProtocolStack}>{MODE_LABEL[Mode.UserModeProtocolStack]}</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="灰度比例" field="grayRatio">
              <InputNumber placeholder="1-100" suffix="%" min={1} max={100} style={{ width: 160 }} />
            </Form.Item>
          </Form>
        )}
        {currentStep === 1 && (
          <div style={{ marginTop: 16 }}>
            <Table
              data={[
                { key: '1', field: '模式', before: '关闭', after: stepForm.getFieldValue('mode') ? MODE_LABEL[stepForm.getFieldValue('mode') as Mode] : '-' },
                { key: '2', field: '灰度比例', before: '-', after: stepForm.getFieldValue('grayRatio') ? `${stepForm.getFieldValue('grayRatio')}%` : '-' },
              ]}
              columns={[
                { title: '配置项', dataIndex: 'field', width: 120 },
                { title: '变更前', dataIndex: 'before' },
                { title: '变更后', dataIndex: 'after' },
              ]}
              rowKey="key"
              pagination={false}
              border
            />
          </div>
        )}
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="服务详情"
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        width={560}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerVisible(false)}>关闭</Button>
            <Button type="primary" onClick={handleDrawerSubmit}>确认</Button>
          </div>
        }
      >
        <div className={styles.drawerContent}>
          <div className={styles.drawerSection}>
            <div className={styles.configSectionTitle}>基本信息</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>PSM</span>
                <span className={styles.infoValue}>sinf.ecology.rayheader_test</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>状态</span>
                <span className={styles.infoValue}><Tag.TagPro type="success">正在运行</Tag.TagPro></span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>负责人</span>
                <span className={styles.infoValue}>宋明杰</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>更新时间</span>
                <span className={styles.infoValue}>2026-04-16 15:27:12</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>服务等级</span>
                <span className={styles.infoValue}>P1</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>业务域</span>
                <span className={styles.infoValue}>基础架构|字节云服务框架</span>
              </div>
            </div>
          </div>
          <div className={styles.drawerSection}>
            <div className={styles.configSectionTitle}>运行配置</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>依赖模式</span>
                <span className={styles.infoValue}>基础镜像</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>基础镜像</span>
                <span className={styles.infoValue}>toutiao.python3</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>启动脚本</span>
                <span className={styles.infoValue}>/opt/tiger/start.sh</span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ModalDrawer;
