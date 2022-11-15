import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { DefaultButton } from '../components/common/Button';
import Room from '../components/home/Room';

function RoomList() {
	return (
		<>
			<ButtonWrapper>
				<Link to="/addPlaylist">
					<DefaultButton>방 만들기</DefaultButton>
				</Link>
			</ButtonWrapper>
			<H2>방 Top 8</H2>
			<H2>최신 방</H2>
			<ListsStyle>
				<Room />
			</ListsStyle>
		</>
	);
}

export default RoomList;

export const ButtonWrapper = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-bottom: 40px;
`;

export const H2 = styled.h2`
	margin-bottom: 30px;
	font-size: 22px;
	font-weight: 500;
`;

export const ListsStyle = styled.div`
	display: flex;
	flex-wrap: wrap;
`;
