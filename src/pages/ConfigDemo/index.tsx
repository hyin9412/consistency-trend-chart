import {
  Button,
  Divider,
  Form,
  FormInstance,
  Input,
  Message,
  PageHeader,
  Radio,
  Select,
  Steps,
  Table,
  Tooltip,
} from '@tod-m/materials/ve-o';
import { IconDelete, IconQuestionCircle } from '@arco-design/web-react/icon';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';

enum DependencyMode {
  BASE_IMAGE = 'base_image',
  SERVICE_IMAGE = 'service_image',
}

const MOCK_IMAGE_OPTIONS = [
  { label: 'toutiao.python3', value: 'toutiao.python3' },
  { label: 'toutiao.java11', value: 'toutiao.java11' },
  { label: 'toutiao.go1.21', value: 'toutiao.go1.21' },
  { label: 'toutiao.node18', value: 'toutiao.node18' },
];

interface RayServiceFormData {
  psm?: string;
  serviceTree?: string;
  serviceDesc?: string;
  serviceLevel?: string;
  containsUserData?: string;
  dataSensitivityLevel?: string;
  serviceOwner?: string;
  serviceAuthPerson?: string;
  serviceAuthGroup?: string;
  dependencyMode?: DependencyMode;
  baseImage?: string;
  codeRepo?: string;
  startScript?: string;
  containerDeps?: string[];
}

function FormField({
  label,
  required,
  tip,
  children,
}: {
  label: string;
  required?: boolean;
  tip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.formField}>
      <div className={styles.formLabel}>
        {Boolean(required) && <span className={styles.requiredStar}>*</span>}
        <span>{label}</span>
        {Boolean(tip) && (
          <Tooltip content={tip}>
            <IconQuestionCircle className={styles.labelTipIcon} />
          </Tooltip>
        )}
      </div>
      <div className={styles.formControl}>{children}</div>
    </div>
  );
}

function FormStep({ form }: { form: FormInstance }) {
  const dependencyMode = Form.useWatch('dependencyMode', form);

  return (
    <Form form={form}>
      <div className={styles.sections}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>服务元信息</div>
          <div className={styles.formGroup}>
            <Form.Item field="psm" noStyle rules={[{ required: true, message: '请输入 PSM' }]}>
              <FormField label="PSM" required tip="Platform Service Management 唯一标识">
                <Input placeholder="请输入" />
              </FormField>
            </Form.Item>
            <Form.Item field="serviceTree" noStyle rules={[{ required: true, message: '请选择服务树' }]}>
              <FormField label="服务树" required>
                <Select
                  placeholder="请输入关键词搜索"
                  showSearch
                  allowClear
                  options={[
                    { label: '服务树dev节点测试', value: 'dev_test' },
                    { label: '服务树prod节点', value: 'prod' },
                  ]}
                />
              </FormField>
            </Form.Item>
            <Form.Item field="serviceDesc" noStyle rules={[{ required: true, message: '请填写服务描述' }]}>
              <FormField label="服务描述" required>
                <Input placeholder="请填写" />
              </FormField>
            </Form.Item>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>服务属性</div>
          <div className={styles.formGroup}>
            <Form.Item field="serviceLevel" noStyle rules={[{ required: true, message: '请选择服务等级' }]}>
              <FormField label="服务等级" required>
                <Radio.Group>
                  <Radio value="P0">P0</Radio>
                  <Radio value="P1">P1</Radio>
                  <Radio value="P2">P2</Radio>
                  <Radio value="P3">P3</Radio>
                </Radio.Group>
              </FormField>
            </Form.Item>
            <Form.Item field="containsUserData" noStyle rules={[{ required: true, message: '请选择是否包含用户数据' }]}>
              <FormField label="包含用户数据" required tip="是否包含终端用户个人数据">
                <Radio.Group>
                  <Radio value="yes">是</Radio>
                  <Radio value="no">否</Radio>
                </Radio.Group>
              </FormField>
            </Form.Item>
            <Form.Item field="dataSensitivityLevel" noStyle rules={[{ required: true, message: '请选择数据敏感等级' }]}>
              <FormField label="数据敏感等级" required tip="数据分类分级标准">
                <Radio.Group>
                  <Radio value="L1">L1</Radio>
                  <Radio value="L2">L2</Radio>
                  <Radio value="L3">L3</Radio>
                  <Radio value="L4">L4</Radio>
                </Radio.Group>
              </FormField>
            </Form.Item>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>权限管控</div>
          <div className={styles.formGroup}>
            <Form.Item field="serviceOwner" noStyle>
              <FormField label="服务负责人" tip="拥有服务全部管理权限">
                <Input placeholder="请输入邮箱前缀搜索" />
              </FormField>
            </Form.Item>
            <Form.Item field="serviceAuthPerson" noStyle>
              <FormField label="服务授权人" tip="拥有服务部分操作权限">
                <Input placeholder="请输入邮箱前缀搜索" />
              </FormField>
            </Form.Item>
            <Form.Item field="serviceAuthGroup" noStyle>
              <FormField label="服务授权组" tip="按部门批量授权">
                <Input placeholder="请输入部门关键词检索" />
              </FormField>
            </Form.Item>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>应用配置</div>
          <div className={styles.formGroup}>
            <Form.Item field="dependencyMode" noStyle rules={[{ required: true, message: '请选择依赖模式' }]}>
              <FormField label="依赖模式" required tip="选择服务的镜像依赖方式">
                <div className={styles.radioWithHint}>
                  <Radio.Group>
                    <Radio value={DependencyMode.BASE_IMAGE}>基础镜像</Radio>
                    <Radio value={DependencyMode.SERVICE_IMAGE}>服务镜像</Radio>
                  </Radio.Group>
                  <span className={styles.radioHintText}>
                    选择"基于服务镜像"时不需要填写基础镜像、容器依赖包
                  </span>
                </div>
              </FormField>
            </Form.Item>
            {dependencyMode !== DependencyMode.SERVICE_IMAGE && (
              <Form.Item field="baseImage" noStyle rules={[{ required: true, message: '请选择基础镜像' }]}>
                <FormField label="基础镜像" required tip="服务运行的基础镜像环境">
                  <Select placeholder="请选择" options={MOCK_IMAGE_OPTIONS} showSearch allowClear />
                </FormField>
              </Form.Item>
            )}
            <Form.Item field="codeRepo" noStyle>
              <FormField label="业务代码仓库">
                <Input placeholder="请填写" />
              </FormField>
            </Form.Item>
            <Form.Item field="startScript" noStyle>
              <FormField label="启动脚本">
                <div className={styles.inputGroup}>
                  <Input style={{ width: 100, flexShrink: 0 }} value="/opt/tiger/" disabled />
                  <Input style={{ flex: 1 }} placeholder="请输入启动脚本路径" />
                </div>
              </FormField>
            </Form.Item>
            {dependencyMode !== DependencyMode.SERVICE_IMAGE && (
              <Form.Item noStyle>
                <FormField label="容器依赖包" tip="运行时依赖的系统包">
                  <Form.List field="containerDeps">
                    {(fields, { add, remove }) => (
                      <div className={styles.depList}>
                        {fields.map(({ field, key }, index) => (
                          <div key={key} className={styles.depRow}>
                            <Form.Item field={field} noStyle rules={[{ required: true, message: '请输入依赖包名称' }]}>
                              <Input placeholder="请输入依赖包名称" style={{ flex: 1 }} />
                            </Form.Item>
                            <button className={styles.deleteBtn} type="button" onClick={() => remove(index)}>
                              <IconDelete />
                            </button>
                          </div>
                        ))}
                        <button className={styles.addBtn} type="button" onClick={() => add('')}>
                          <span className={styles.addIcon}>+</span>
                          <span>添加依赖</span>
                        </button>
                      </div>
                    )}
                  </Form.List>
                </FormField>
              </Form.Item>
            )}
          </div>
        </div>
      </div>
    </Form>
  );
}

function ConfirmStep({ formData }: { formData: RayServiceFormData }) {
  const columns = [
    { title: '配置项', dataIndex: 'field', width: 120 },
    { title: '内容', dataIndex: 'value' },
  ];

  const metaData = [
    { key: 'psm', field: 'PSM', value: formData.psm || '-' },
    { key: 'serviceTree', field: '服务树', value: formData.serviceTree || '-' },
    { key: 'serviceDesc', field: '服务描述', value: formData.serviceDesc || '-' },
  ];

  const attrData = [
    { key: 'serviceLevel', field: '服务等级', value: formData.serviceLevel || '-' },
    { key: 'containsUserData', field: '包含用户数据', value: formData.containsUserData === 'yes' ? '是' : '否' },
    { key: 'dataSensitivityLevel', field: '数据敏感等级', value: formData.dataSensitivityLevel || '-' },
  ];

  const permData = [
    { key: 'serviceOwner', field: '服务负责人', value: formData.serviceOwner || '-' },
    { key: 'serviceAuthPerson', field: '服务授权人', value: formData.serviceAuthPerson || '-' },
    { key: 'serviceAuthGroup', field: '服务授权组', value: formData.serviceAuthGroup || '-' },
  ];

  const imageLabel = MOCK_IMAGE_OPTIONS.find((o) => o.value === formData.baseImage)?.label || formData.baseImage || '-';
  const appData = [
    {
      key: 'dependencyMode',
      field: '依赖模式',
      value: formData.dependencyMode === DependencyMode.SERVICE_IMAGE ? '服务镜像' : '基础镜像',
    },
    ...(formData.dependencyMode !== DependencyMode.SERVICE_IMAGE
      ? [{ key: 'baseImage', field: '基础镜像', value: imageLabel }]
      : []),
    { key: 'codeRepo', field: '业务代码仓库', value: formData.codeRepo || '-' },
    {
      key: 'startScript',
      field: '启动脚本',
      value: formData.startScript ? `/opt/tiger/${formData.startScript}` : '-',
    },
    ...(formData.dependencyMode !== DependencyMode.SERVICE_IMAGE
      ? [{ key: 'containerDeps', field: '容器依赖包', value: (formData.containerDeps || []).filter(Boolean).join(', ') || '-' }]
      : []),
  ];

  return (
    <div className={styles.confirmSections}>
      <div className={styles.confirmSection}>
        <div className={styles.sectionTitle}>服务元信息</div>
        <Table data={metaData} columns={columns} rowKey="key" pagination={false} border />
      </div>
      <div className={styles.confirmSection}>
        <div className={styles.sectionTitle}>服务属性</div>
        <Table data={attrData} columns={columns} rowKey="key" pagination={false} border />
      </div>
      <div className={styles.confirmSection}>
        <div className={styles.sectionTitle}>权限管控</div>
        <Table data={permData} columns={columns} rowKey="key" pagination={false} border />
      </div>
      <div className={styles.confirmSection}>
        <div className={styles.sectionTitle}>应用配置</div>
        <Table data={appData} columns={columns} rowKey="key" pagination={false} border />
      </div>
    </div>
  );
}

const ConfigDemo = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState<RayServiceFormData>({});

  const handleBack = useCallback(() => {
    navigate('/list-demo');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/list-demo');
  }, [navigate]);

  const handleNext = useCallback(async () => {
    setFormSnapshot(form.getFieldsValue() as RayServiceFormData);
    setCurrentStep(1);
  }, [form]);

  const handlePrev = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      console.log('提交创建 Ray 服务:', values);
      await new Promise((resolve) => setTimeout(resolve, 500));
      Message.success('创建成功');
      navigate('/list-demo');
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader title="创建 Ray 服务" backIcon onBack={handleBack} />
        <Divider className={styles.headerDivider} />
        <div className={styles.stepsWrapper}>
          <Steps current={currentStep + 1} className={styles.steps}>
            <Steps.Step title="信息填写" />
            <Steps.Step title="信息确认" />
          </Steps>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.formArea}>
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <FormStep form={form} />
          </div>
          {currentStep === 1 && <ConfirmStep formData={formSnapshot} />}
        </div>
      </div>

      <div className={styles.footer}>
        <Divider className={styles.footerDivider} />
        <div className={styles.footerContent}>
          <div className={styles.footerButtons}>
            <Button onClick={handleCancel}>取消</Button>
            {currentStep === 1 && <Button onClick={handlePrev}>上一步</Button>}
            {currentStep === 0 && (
              <Button type="primary" onClick={handleNext}>下一步</Button>
            )}
            {currentStep === 1 && (
              <Button type="primary" loading={loading} onClick={handleSubmit}>提交</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigDemo;
