import { useSelector, useDispatch } from 'react-redux';

import { down, init, up, selectValue } from '../slices/counterSlice';
import styled from 'styled-components';

const Main = () => {
	const dispach = useDispatch();
	const count = useSelector(selectValue);
	const addNumber = () => {
		dispach(up(1));
	};
	const minusNumber = () => {
		dispach(down(1));
	};
	const initNumber = () => {
		dispach(init());
	};
	return (
		<MainStyle>
			<div>{count}</div>
			<button onClick={addNumber}>+</button>
			<button onClick={minusNumber}>-</button>
			<button onClick={initNumber}>초기화</button>
			<a href="www.naver.com">링크</a>
		</MainStyle>
	);
};

export default Main;

const MainStyle = styled.div`
	margin-top: 300px;
	display: flex;
	justify-content: center;
	align-items: center;
`;
