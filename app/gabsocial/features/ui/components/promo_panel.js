import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Icon from 'gabsocial/components/icon';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  promoItems: state.getIn(['soapbox', 'promoPanel', 'items']),
});

export default @connect(mapStateToProps)
class PromoPanel extends React.PureComponent {

  static propTypes = {
    promoItems: ImmutablePropTypes.list,
  }

  render() {
    const { promoItems } = this.props;
    if (!promoItems) return null;

    return (
      <div className='wtf-panel promo-panel'>
        <div className='promo-panel__container'>
          {promoItems.map((item, i) =>
            (<div className='promo-panel-item' key={i}>
              <a className='promo-panel-item__btn' href={item.get('url')} target='_blank'>
                <Icon id={item.get('icon')} className='promo-panel-item__icon' fixedWidth />
                {item.get('text')}
              </a>
            </div>)
          )}
        </div>
      </div>
    );
  }

}
