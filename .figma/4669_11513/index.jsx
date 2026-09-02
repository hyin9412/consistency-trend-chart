import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame2147241447}>
      <div className={styles.frame2147241771}>
        <div className={styles.frame2147241441}>
          <div className={styles.rectangle34625096} />
          <div className={styles.frame2119904138}>
            <p className={styles.text}>稽核通过率</p>
            <img src="../image/mt8fdhsd-3mf7wxd.svg" className={styles.frame} />
          </div>
          <div className={styles.component1}>
            <img
              src="../image/mt8fdhsd-60j8wo9.svg"
              className={styles.group2224074}
            />
            <div className={styles.group2224075}>
              <div className={styles.autoWrapper}>
                <div className={styles.group2224077}>
                  <p className={styles.a25}>25</p>
                  <p className={styles.a9023}>
                    <span className={styles.a902}>90.2</span>
                    <span className={styles.a9022}>%</span>
                  </p>
                  <p className={styles.a25}>75</p>
                </div>
                <div className={styles.component61}>
                  <p className={styles.text2}>较上次检测</p>
                  <div className={styles.frame2036083830}>
                    <img
                      src="../image/mt8fdhsd-xidl9yv.svg"
                      className={styles.frame2053140613}
                    />
                    <p className={styles.text3}>2.3</p>
                  </div>
                </div>
              </div>
              <div className={styles.autoWrapper2}>
                <p className={styles.a0}>0</p>
                <p className={styles.a50}>50</p>
                <p className={styles.a100}>100</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.frame2147241449}>
          <div className={styles.frame1410097891}>
            <div className={styles.frame2147241769}>
              <p className={styles.text}>不参与稽核</p>
              <img src="../image/mt8fdhsd-77w8y6r.svg" className={styles.frame2} />
            </div>
            <p className={styles.a1172}>0</p>
            <p className={styles.text6}>
              <span className={styles.text4}>生效豁免：</span>
              <span className={styles.text5}>
                2<br />
              </span>
              <span className={styles.text4}>24h 内到期：</span>
              <span className={styles.text5}>1</span>
            </p>
          </div>
          <div className={styles.frame1410097892}>
            <div className={styles.frame2147241769}>
              <p className={styles.text}>稽核豁免</p>
              <img src="../image/mt8fdhsd-77w8y6r.svg" className={styles.frame2} />
            </div>
            <p className={styles.a1172}>2</p>
          </div>
        </div>
      </div>
      <div className={styles.frame2147241666}>
        <div className={styles.section}>
          <div className={styles.frame2147241443}>
            <div className={styles.frame2117130975}>
              <div className={styles.frame2082893658}>
                <img
                  src="../image/mt8fdhsd-f4anppo.svg"
                  className={styles.closeCircleFill}
                />
                <p className={styles.text}>硬卡拦截</p>
                <p className={styles.text7}>未入账，需优先修复或申请豁免</p>
              </div>
              <img src="../image/mt8fdhsd-ttr9kb5.svg" className={styles.frame2} />
            </div>
            <p className={styles.a1172}>403</p>
          </div>
          <div className={styles.frame2147241442}>
            <div className={styles.container}>
              <div className={styles.text9}>
                <p className={styles.r1}>R1</p>
                <p className={styles.text8}>无有效订单</p>
              </div>
              <p className={styles.a168}>168</p>
            </div>
            <div className={styles.container}>
              <div className={styles.text9}>
                <p className={styles.r1}>R2</p>
                <p className={styles.text8}>叶子节点校验不通过</p>
              </div>
              <p className={styles.a168}>89</p>
            </div>
            <div className={styles.container}>
              <div className={styles.text9}>
                <p className={styles.r1}>R3</p>
                <p className={styles.text8}>用量超过订单值</p>
              </div>
              <p className={styles.a168}>87</p>
            </div>
            <div className={styles.container}>
              <div className={styles.text9}>
                <p className={styles.r1}>R4</p>
                <p className={styles.text8}>InstanceMeta 字段缺失、格式不合规</p>
              </div>
              <p className={styles.a168}>59</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.frame2147241667}>
        <div className={styles.section2}>
          <div className={styles.frame2147241443}>
            <div className={styles.frame2117130975}>
              <div className={styles.frame2082893658}>
                <img
                  src="../image/mt8fdhsd-viz9k0e.svg"
                  className={styles.closeCircleFill}
                />
                <p className={styles.text}>软卡告警</p>
                <p className={styles.text7}>
                  已入账但稽核校验不通过，需持续跟进修复
                </p>
              </div>
              <img src="../image/mt8fdhsd-ttr9kb5.svg" className={styles.frame2} />
            </div>
            <p className={styles.a1172}>403</p>
          </div>
          <div className={styles.frame21472414422}>
            <div className={styles.container}>
              <div className={styles.text9}>
                <p className={styles.r1}>R3</p>
                <p className={styles.text8}>用量超过订单值</p>
              </div>
              <p className={styles.a168}>87</p>
            </div>
            <div className={styles.container}>
              <div className={styles.text9}>
                <p className={styles.r1}>R5</p>
                <p className={styles.text8}>用量不一致（T+2 离线复核）</p>
              </div>
              <p className={styles.a168}>59</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
