import React from 'react'
import { Carousel } from 'antd'
import './Carrousel.css'

export const Carrousel = () => {
	return (
		<div className='container'>
			<Carousel effect='fade' autoplay>
				<div>
					<h3>AEGIS</h3>
				</div>
				<div>
					<h3>WEB</h3>
				</div>
				<div>
					<h3>SITE</h3>
				</div>
				<div>
					<h3>LYCO ET DOK</h3>
				</div>
			</Carousel>
		</div>
	)
}
