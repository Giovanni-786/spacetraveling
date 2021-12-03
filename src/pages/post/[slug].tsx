import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar,FiUser,FiClock } from "react-icons/fi";

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import React from 'react';

interface Post {
  first_publication: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  return (
    <>
    <main className={styles.container_banner}>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner post" />
      </div>
    </main>

    <main className={styles.container_title}>
    <h1>{post.data.title}</h1>
      <div className={styles.info}>
        <p> <FiUser />{post.data.author}</p>
        <p><FiCalendar /> {post.first_publication}</p>
        <p> <FiClock /> 4 min</p>
      </div>
    </main>

    <main className={styles.container_content}>
      {post.data.content.map(content => {
        return(
        <>
        <div className={styles.content}>
          <h2>{content.heading}</h2>
          {content.body.map(body => {
            return(
            <div className={styles.container_body_text}>
              <p>{body.text}</p>
            </div>
            );
          })}
        </div>
        </>
        )
      })}
     
    </main>
    </>
  );
}

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
}
 
};

export const getStaticProps = async({ params }) => {
  const { slug } = params;
  
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  
  const post = {
    slug,
    first_publication: format(new Date(response.first_publication_date), "dd MMM yyyy", {
      locale: ptBR
    }),
    ...response
  }

  return {
    props: {
        post
    },
    revalidate: 60 * 30, // 30 minutes
}

};
